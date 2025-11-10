import { NextRequest, NextResponse } from 'next/server';

interface IncomingWebhookPayload {
  campaign_id?: string;
  campaign_name?: string;
  contact_id: string;
  email?: string;
  id?: string;
  run_id?: string;
  shape_id?: string;
  shape_title?: string;
  time?: string;
  webhook_id?: string;
  webhook_name?: string;
}

interface AP3ApiRequest {
  people: Array<{
    fields: {
      'str::person_id': string;
      'str:cm:orttoid': string;
    };
  }>;
  merge_by: string[];
  merge_strategy: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    console.log('[WEBHOOK] Received payload:', JSON.stringify(body, null, 2));

    const payload = body.body || body;
    const contactId = payload.contact_id;

    if (!contactId) {
      console.error('[WEBHOOK] Missing contact_id in payload');
      return NextResponse.json(
        { success: false, error: 'Missing contact_id in payload' },
        { status: 400 }
      );
    }

    console.log(`[WEBHOOK] Extracted contact_id: ${contactId}`);

    const apiKey = process.env.AP3_API_KEY;
    if (!apiKey) {
      console.error('[WEBHOOK] AP3_API_KEY environment variable not set');
      return NextResponse.json(
        { success: false, error: 'API configuration error' },
        { status: 500 }
      );
    }

    const ap3Payload: AP3ApiRequest = {
      people: [
        {
          fields: {
            'str::person_id': contactId,
            'str:cm:orttoid': contactId,
          },
        },
      ],
      merge_by: ['str::person_id'],
      merge_strategy: 2,
    };

    console.log('[AP3] Sending request to AP3 API:', JSON.stringify(ap3Payload, null, 2));

    const ap3Response = await fetch('https://api.eu.ap3api.com/v1/person/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(ap3Payload),
      signal: AbortSignal.timeout(30000),
    });

    const responseText = await ap3Response.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = responseText;
    }

    const duration = Date.now() - startTime;

    if (!ap3Response.ok) {
      console.error(
        `[AP3] API call failed: ${ap3Response.status} ${ap3Response.statusText}`,
        responseData
      );
      return NextResponse.json(
        {
          success: false,
          error: 'AP3 API call failed',
          status: ap3Response.status,
          details: responseData,
          duration_ms: duration,
        },
        { status: ap3Response.status }
      );
    }

    console.log(`[AP3] API call successful (${duration}ms):`, responseData);

    return NextResponse.json({
      success: true,
      contact_id: contactId,
      ap3_response: responseData,
      duration_ms: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[WEBHOOK] Error processing webhook:', errorMessage);
    console.error('[WEBHOOK] Error details:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: errorMessage,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}
