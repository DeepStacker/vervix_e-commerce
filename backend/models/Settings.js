const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['general', 'notifications', 'security', 'payment', 'email', 'shipping', 'tax'],
    index: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    description: String,
    tags: [String],
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
SettingsSchema.index({ category: 1, isActive: 1 });

// Static method to get settings by category
SettingsSchema.statics.getByCategory = async function(category) {
  const setting = await this.findOne({ category, isActive: true }).sort({ updatedAt: -1 });
  return setting ? setting.settings : null;
};

// Static method to update settings by category
SettingsSchema.statics.updateByCategory = async function(category, settings, updatedBy) {
  const existingSetting = await this.findOne({ category, isActive: true });
  
  if (existingSetting) {
    existingSetting.settings = { ...existingSetting.settings, ...settings };
    existingSetting.updatedBy = updatedBy;
    existingSetting.version += 1;
    await existingSetting.save();
    return existingSetting;
  } else {
    const newSetting = new this({
      category,
      settings,
      updatedBy,
      version: 1
    });
    await newSetting.save();
    return newSetting;
  }
};

// Method to create settings backup before update
SettingsSchema.methods.createBackup = async function() {
  const backup = new this.constructor({
    category: this.category + '_backup_' + Date.now(),
    settings: this.settings,
    updatedBy: this.updatedBy,
    isActive: false,
    version: this.version,
    metadata: {
      ...this.metadata,
      description: `Backup of ${this.category} settings created at ${new Date().toISOString()}`
    }
  });
  await backup.save();
  return backup;
};

module.exports = mongoose.model('Settings', SettingsSchema);
