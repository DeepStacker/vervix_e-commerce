const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (name, email) => ({
    subject: 'Welcome to Vervix - Your Premium E-commerce Destination',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">Welcome to Vervix</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0;">Your Premium E-commerce Experience</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #34495e; font-size: 22px;">Hello ${name}!</h2>
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              Welcome to Vervix! We're thrilled to have you join our community of discerning shoppers.
            </p>
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              Your account has been successfully created with email: <strong>${email}</strong>
            </p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">What's Next?</h3>
            <ul style="color: #5d6d7e; font-size: 14px; line-height: 1.8;">
              <li>Browse our curated collection of premium products</li>
              <li>Set up your delivery preferences</li>
              <li>Add items to your wishlist</li>
              <li>Enjoy exclusive member benefits</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL}/products" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Start Shopping
            </a>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              © 2024 Vervix. All rights reserved.<br>
              If you have questions, contact us at support@vervix.com
            </p>
          </div>
        </div>
      </div>
    `
  }),

  passwordReset: (name, resetToken, resetUrl) => ({
    subject: 'Password Reset Request - Vervix',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">Password Reset</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0;">Vervix Account Security</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #34495e; font-size: 22px;">Hello ${name}!</h2>
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. If you made this request, click the button below to reset your password.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0; font-size: 16px;">Security Notice</h3>
            <p style="color: #856404; font-size: 14px; margin: 0;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email or contact support.
            </p>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              © 2024 Vervix. All rights reserved.<br>
              For security questions, contact us at security@vervix.com
            </p>
          </div>
        </div>
      </div>
    `
  }),

  orderConfirmation: (name, order) => ({
    subject: `Order Confirmation #${order.orderNumber} - Vervix`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #27ae60; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0;">Thank you for your purchase</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #34495e; font-size: 22px;">Hello ${name}!</h2>
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              Your order has been confirmed and is being processed. Here are your order details:
            </p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Order Summary</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50;">Order Items</h3>
            ${order.items.map(item => `
              <div style="border-bottom: 1px solid #ecf0f1; padding: 15px 0; display: flex; align-items: center;">
                <div style="flex: 1;">
                  <h4 style="margin: 0; color: #34495e;">${item.name}</h4>
                  <p style="margin: 5px 0; color: #7f8c8d;">Quantity: ${item.quantity}</p>
                  <p style="margin: 5px 0; color: #27ae60; font-weight: bold;">₹${item.price.toFixed(2)}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Track Order
            </a>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              © 2024 Vervix. All rights reserved.<br>
              Questions about your order? Contact us at orders@vervix.com
            </p>
          </div>
        </div>
      </div>
    `
  }),

  lowStockAlert: (productName, currentStock, minStock) => ({
    subject: `Low Stock Alert: ${productName} - Vervix Admin`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f39c12; margin: 0; font-size: 28px;">⚠️ Low Stock Alert</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0;">Inventory Management System</p>
          </div>
          
          <div style="background-color: #fef9e7; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f39c12;">
            <h3 style="color: #b7950b; margin-top: 0;">Stock Alert Details</h3>
            <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
            <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${currentStock} units</p>
            <p style="margin: 5px 0;"><strong>Minimum Stock Level:</strong> ${minStock} units</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              The product "${productName}" has fallen below the minimum stock level. 
              Please restock this item to avoid stockouts and potential lost sales.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL}/admin/products" style="background-color: #f39c12; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Manage Inventory
            </a>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              © 2024 Vervix Admin System. All rights reserved.<br>
              This is an automated alert from the inventory management system.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  orderStatusUpdate: (name, order, newStatus) => ({
    subject: `Order #${order.orderNumber} Status Updated - Vervix`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3498db; margin: 0; font-size: 28px;">Order Status Updated</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0;">Order #${order.orderNumber}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #34495e; font-size: 22px;">Hello ${name}!</h2>
            <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6;">
              Your order status has been updated. Here are the latest details:
            </p>
          </div>
          
          <div style="background-color: #e8f6f3; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #27ae60;">
            <h3 style="color: #27ae60; margin-top: 0;">Status: ${newStatus}</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              View Order Details
            </a>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              © 2024 Vervix. All rights reserved.<br>
              Questions about your order? Contact us at orders@vervix.com
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send welcome email
  sendWelcomeEmail: async (user) => {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.welcome(user.name, user.email);
      
      await transporter.sendMail({
        from: `"Vervix E-commerce" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      
      console.log(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const transporter = createTransporter();
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const template = emailTemplates.passwordReset(user.name, resetToken, resetUrl);
      
      await transporter.sendMail({
        from: `"Vervix Security" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      
      console.log(`Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  },

  // Send order confirmation email
  sendOrderConfirmationEmail: async (user, order) => {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.orderConfirmation(user.name, order);
      
      await transporter.sendMail({
        from: `"Vervix Orders" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      
      console.log(`Order confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  },

  // Send low stock alert to admins
  sendLowStockAlert: async (productName, currentStock, minStock) => {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.lowStockAlert(productName, currentStock, minStock);
      
      // Get admin emails
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
      const adminEmails = admins.map(admin => admin.email);
      
      if (adminEmails.length > 0) {
        await transporter.sendMail({
          from: `"Vervix System" <${process.env.EMAIL_USER}>`,
          to: adminEmails.join(','),
          subject: template.subject,
          html: template.html
        });
        
        console.log(`Low stock alert sent to ${adminEmails.length} admins`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return false;
    }
  },

  // Send order status update email
  sendOrderStatusUpdateEmail: async (user, order, newStatus) => {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.orderStatusUpdate(user.name, order, newStatus);
      
      await transporter.sendMail({
        from: `"Vervix Orders" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      
      console.log(`Order status update email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending order status update email:', error);
      return false;
    }
  },

  // Generate password reset token
  generatePasswordResetToken: async (email) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      return resetToken;
    } catch (error) {
      console.error('Error generating password reset token:', error);
      throw error;
    }
  },

  // Verify password reset token
  verifyPasswordResetToken: async (token) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      return user;
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      throw error;
    }
  }
};

module.exports = emailService;
