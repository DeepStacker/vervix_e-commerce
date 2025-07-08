const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'video', 'document', 'audio', 'other']
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  altText: String,
  caption: String,
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    dimensions: {
      width: Number,
      height: Number
    },
    duration: Number, // for videos/audio
    quality: String,
    compression: String
  },
  usage: [{
    entityType: {
      type: String,
      enum: ['product', 'category', 'banner', 'blog', 'user', 'other']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    context: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
MediaSchema.index({ fileName: 1 });
MediaSchema.index({ fileType: 1 });
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ tags: 1 });

// Virtual for file extension
MediaSchema.virtual('fileExtension').get(function() {
  return this.fileName.split('.').pop().toLowerCase();
});

// Static method to get files by type
MediaSchema.statics.getByType = function(fileType, limit = 50) {
  return this.find({ fileType, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'firstName lastName email');
};

// Static method to search files
MediaSchema.statics.searchFiles = function(searchTerm, limit = 50) {
  return this.find({
    isActive: true,
    $or: [
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { fileName: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { altText: { $regex: searchTerm, $options: 'i' } },
      { caption: { $regex: searchTerm, $options: 'i' } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('uploadedBy', 'firstName lastName email');
};

// Method to add usage tracking
MediaSchema.methods.addUsage = function(entityType, entityId, context = '') {
  const existingUsage = this.usage.find(u => 
    u.entityType === entityType && 
    u.entityId.toString() === entityId.toString()
  );
  
  if (!existingUsage) {
    this.usage.push({ entityType, entityId, context });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove usage tracking
MediaSchema.methods.removeUsage = function(entityType, entityId) {
  this.usage = this.usage.filter(u => 
    !(u.entityType === entityType && u.entityId.toString() === entityId.toString())
  );
  return this.save();
};

// Method to check if file is in use
MediaSchema.methods.isInUse = function() {
  return this.usage.length > 0;
};

module.exports = mongoose.model('Media', MediaSchema);
