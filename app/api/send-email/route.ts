import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceType, lockoutType, customerName, phoneNumber, notes, userAddress, coordinates } = body

    // Create email content with spam-friendly format
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Locksmith Service Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; padding: 20px; line-height: 1.6;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 24px;">Locksmith Service Request</h2>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057; width: 30%;">Service Type:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${serviceType === 'lockout' ? 'Emergency Lockout' : 'Other Key Services'}${lockoutType ? ` - ${lockoutType.charAt(0).toUpperCase() + lockoutType.slice(1)}` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Customer Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Phone Number:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${phoneNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Location:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${userAddress}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Coordinates:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529; font-family: monospace; font-size: 14px;">${coordinates}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Additional Notes:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; color: #856404; font-weight: bold;">URGENT: Customer needs immediate assistance</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">Please contact the customer as soon as possible to confirm dispatch.</p>
          </div>
          
          <div style="text-align: center; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">Bremer Locksmith</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6c757d;">24/7 Emergency Service • Licensed & Insured</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">Minnesota</p>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@bremerlocksmith.com',
      to: [process.env.ADMIN_EMAIL || 'alsetsolutionsinc@gmail.com'],
      subject: `Locksmith Service Request - ${serviceType === 'lockout' ? 'Emergency Lockout' : 'Key Services'} - ${customerName}`,
      html: emailContent,
      // Add text version for better deliverability
      text: `
Locksmith Service Request

Service Type: ${serviceType === 'lockout' ? 'Emergency Lockout' : 'Other Key Services'}${lockoutType ? ` - ${lockoutType.charAt(0).toUpperCase() + lockoutType.slice(1)}` : ''}
Customer Name: ${customerName}
Phone Number: ${phoneNumber}
Location: ${userAddress}
Coordinates: ${coordinates}
${notes ? `Additional Notes: ${notes}` : ''}

URGENT: Customer needs immediate assistance. Please contact the customer as soon as possible to confirm dispatch.

Bremer Locksmith - 24/7 Emergency Service - Licensed & Insured
      `,
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'Bremer Locksmith System',
        'Reply-To': process.env.FROM_EMAIL || 'noreply@bremerlocksmith.com',
      },
      // Add tags for better tracking
      tags: [
        { name: 'service-type', value: serviceType },
        { name: 'priority', value: serviceType === 'lockout' ? 'high' : 'normal' },
        { name: 'source', value: 'website-form' }
      ]
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
