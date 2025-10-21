// Test script to send email using mailService
require('dotenv').config();

// Setup module aliases
require('module-alias/register');
require('module-alias').addAlias('@', __dirname + '/src');

const { sendEmail } = require('./src/modules/email/services/MailService');

async function testSendEmail() {
  try {
    console.log('🔄 Testing email configuration...');
    console.log('MAIL_DRIVER:', process.env.MAIL_DRIVER);
    console.log('MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS);
    console.log('MAIL_FROM_NAME:', process.env.MAIL_FROM_NAME);

    const result = await sendEmail({
      to: 'lecongtien.dev@gmail.com',
      subject: 'Test Email from KleverBot',
      template: 'welcome',
      context: {
        firstName: 'Tien',
        year: new Date().getFullYear()
      }
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);

    // If using ethereal test account, show preview URL
    if (result.preview) {
      console.log('📧 Preview URL:', result.preview);
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Full error:', error);
  }
}

testSendEmail();
