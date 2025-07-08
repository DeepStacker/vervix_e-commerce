const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (context) => ({
    subject: 'Welcome to Vervix - Your Luxury Fashion Destination',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to Vervix</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 36px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 40px 20px; }
          .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #c9a96e 0%, #b8956a 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Welcome to Vervix, ${context.firstName}!</div>
            <div class="text">
              Thank you for joining our exclusive community of luxury fashion enthusiasts. 
              At Vervix, we curate the finest collection of premium clothing and accessories 
              to elevate your style to new heights.
            </div>
            <div class="text">
              Your account has been successfully created with the email: <strong>${context.email}</strong>
            </div>
            <div class="text">
              Start exploring our latest collections and enjoy exclusive member benefits including:
            </div>
            <ul style="color: #666666; line-height: 1.6;">
              <li>Early access to new arrivals</li>
              <li>Exclusive discounts and offers</li>
              <li>Priority customer support</li>
              <li>Free shipping on orders over $100</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
            <p>Luxury Fashion • Premium Quality • Exceptional Service</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'login-notification': (context) => ({
    subject: 'Login Notification - Vervix',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Login Notification</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .info-box { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Login Notification</div>
            <div class="text">Hello ${context.firstName},</div>
            <div class="text">
              We wanted to let you know that your Vervix account was accessed.
            </div>
            <div class="info-box">
              <strong>Login Details:</strong><br>
              Time: ${context.loginTime}<br>
              IP Address: ${context.ipAddress}
            </div>
            <div class="text">
              If this was you, no further action is needed. If you don't recognize this login, 
              please secure your account immediately by changing your password.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'password-reset': (context) => ({
    subject: 'Password Reset Request - Vervix',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .button { display: inline-block; background: linear-gradient(135deg, #c9a96e 0%, #b8956a 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Password Reset Request</div>
            <div class="text">Hello ${context.firstName},</div>
            <div class="text">
              We received a request to reset your password for your Vervix account. 
              Click the button below to reset your password:
            </div>
            <a href="${context.resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 10 minutes for security reasons.
            </div>
            <div class="text">
              If you didn't request this password reset, please ignore this email. 
              Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'order-confirmation': (context) => ({
    subject: `Order Confirmation - ${context.orderNumber} - Vervix`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Order Confirmation</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .order-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #e9ecef; }
          .item:last-child { border-bottom: none; }
          .item-image { width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 15px; }
          .item-details { flex: 1; }
          .item-name { font-weight: bold; color: #1a1a1a; margin-bottom: 5px; }
          .item-price { color: #c9a96e; font-weight: bold; }
          .total { background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Order Confirmation</div>
            <div class="text">Thank you for your order, ${context.customerName}!</div>
            <div class="text">Your order has been successfully placed and is being processed.</div>
            
            <div class="order-info">
              <strong>Order Details:</strong><br>
              Order Number: ${context.orderNumber}<br>
              Order Date: ${context.orderDate}<br>
              Status: ${context.status}
            </div>
            
            <div class="order-info">
              <strong>Items Ordered:</strong>
            ${context.items.map(item => `
              <div class="item">
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-details">
                  <div class="item-name">${item.name}</div>
                    <div>Size: ${item.size} | Color: ${item.color}</div>
                  <div>Quantity: ${item.quantity}</div>
                    <div class="item-price">₹${item.price}</div>
                  </div>
                </div>
              `).join('')}
              </div>
            
            <div class="total">
              <strong>Total Amount: ₹${context.total}</strong>
            </div>
            
            <div class="text">
              We'll send you updates on your order status. You can also track your order in your account.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'order-status-update': (context) => ({
    subject: `Order Status Update - ${context.orderNumber} - Vervix`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .status-box { background-color: #e8f5e8; color: #2d5a2d; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Order Status Update</div>
            <div class="text">Hello ${context.customerName},</div>
            <div class="text">Your order status has been updated.</div>
            
            <div class="status-box">
              <strong>Order Number: ${context.orderNumber}</strong><br>
              <strong>New Status: ${context.newStatus}</strong><br>
              ${context.trackingNumber ? `Tracking Number: ${context.trackingNumber}` : ''}
            </div>
            
            <div class="text">
              ${context.statusMessage}
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'low-stock-alert': (context) => ({
    subject: `Low Stock Alert - ${context.productName} - Vervix`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Low Stock Alert</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .alert-box { background-color: #fff3cd; color: #856404; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .product-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Low Stock Alert</div>
            <div class="text">Hello Admin,</div>
            
            <div class="alert-box">
              <strong>⚠️ Low Stock Alert</strong><br>
              A product is running low on inventory and may need restocking.
            </div>
            
            <div class="product-info">
              <strong>Product Details:</strong><br>
              Name: ${context.productName}<br>
              SKU: ${context.sku}<br>
              Current Stock: ${context.currentStock}<br>
              Low Stock Threshold: ${context.threshold}<br>
              Category: ${context.category}
            </div>
            
            <div class="text">
              Please review the inventory and consider placing a reorder if necessary.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'admin-order-notification': (context) => ({
    subject: `New Order Received - ${context.orderNumber} - Vervix`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>New Order Notification</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .order-summary { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">New Order Received</div>
            <div class="text">A new order has been placed and requires processing.</div>
            
            <div class="order-summary">
              <strong>Order Summary:</strong><br>
              Order Number: ${context.orderNumber}<br>
              Customer: ${context.customerName}<br>
              Email: ${context.customerEmail}<br>
              Total Amount: ₹${context.total}<br>
              Items: ${context.itemCount}<br>
              Payment Method: ${context.paymentMethod}
            </div>
            
            <div class="text">
              Please log into the admin panel to process this order.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  'return-request': (context) => ({
    subject: `Return Request - ${context.orderNumber} - Vervix`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Return Request</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; }
          .logo { color: #c9a96e; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px 20px; }
          .title { color: #1a1a1a; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .text { color: #666666; line-height: 1.6; margin-bottom: 15px; }
          .return-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERVIX</div>
          </div>
          <div class="content">
            <div class="title">Return Request Received</div>
            <div class="text">Hello ${context.customerName},</div>
            <div class="text">We have received your return request for order ${context.orderNumber}.</div>
            
            <div class="return-info">
              <strong>Return Details:</strong><br>
              Order Number: ${context.orderNumber}<br>
              Return Reason: ${context.reason}<br>
              Items: ${context.items}<br>
              Status: ${context.status}
            </div>
            
            <div class="text">
              Our team will review your return request and get back to you within 24-48 hours.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Vervix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let mailOptions = {
      from: `"Vervix" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject
    };

    // If template is specified, use it
    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template](options.context || {});
      mailOptions.subject = template.subject;
      mailOptions.html = template.html;
    } else {
      // Use custom content
      mailOptions.html = options.html;
      mailOptions.text = options.text;
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Specific email functions
const sendWelcomeEmail = (userEmail, firstName) => {
  return sendEmail({
    to: userEmail,
    template: 'welcome',
    context: { firstName, email: userEmail }
  });
};

const sendLoginNotification = (userEmail, firstName, loginDetails) => {
  return sendEmail({
    to: userEmail,
    template: 'login-notification',
    context: { firstName, ...loginDetails }
  });
};

const sendPasswordResetEmail = (userEmail, firstName, resetToken) => {
  return sendEmail({
    to: userEmail,
    template: 'password-reset',
    context: {
      firstName,
      resetToken,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    }
  });
};

const sendOrderConfirmationEmail = (userEmail, orderDetails) => {
  return sendEmail({
    to: userEmail,
    template: 'order-confirmation',
    context: orderDetails
  });
};

const sendOrderStatusUpdateEmail = (userEmail, orderDetails) => {
  const template = emailTemplates['order-status-update'](orderDetails);
  return sendEmail({
    email: userEmail,
    subject: template.subject,
    html: template.html
  });
};

const sendLowStockAlertEmail = (adminEmail, productDetails) => {
  const template = emailTemplates['low-stock-alert'](productDetails);
  return sendEmail({
    email: adminEmail,
    subject: template.subject,
    html: template.html
  });
};

const sendAdminOrderNotification = (adminEmail, orderDetails) => {
  const template = emailTemplates['admin-order-notification'](orderDetails);
  return sendEmail({
    email: adminEmail,
    subject: template.subject,
    html: template.html
  });
};

const sendReturnRequestEmail = (userEmail, returnDetails) => {
  const template = emailTemplates['return-request'](returnDetails);
  return sendEmail({
    email: userEmail,
    subject: template.subject,
    html: template.html
  });
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('📧 Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendLowStockAlertEmail,
  sendAdminOrderNotification,
  sendReturnRequestEmail,
  testEmailConnection
};
