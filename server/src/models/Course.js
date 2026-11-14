import mongoose from 'mongoose';

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/') || trimmed.includes('player.vimeo.com/video/')) {
    return trimmed;
  }
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return trimmed;
}

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [200, 'Lesson title cannot exceed 200 characters']
    },
    duration: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['video', 'text'],
      default: 'video'
    },
    embedUrl: {
      type: String,
      default: '',
      trim: true
    },
    content: {
      type: String,
      default: '',
      trim: true
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: [200, 'Section title cannot exceed 200 characters']
    },
    order: {
      type: Number,
      default: 0
    },
    lessons: {
      type: [lessonSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Course title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Course slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required']
    },
    instructorName: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price must be non-negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected'],
      default: 'draft'
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },
    sections: {
      type: [sectionSchema],
      default: []
    },
    totalLessons: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

courseSchema.virtual('isFree').get(function () {
  return this.price === 0;
});

// Update totalLessons and ensure slug
courseSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  if (this.sections && Array.isArray(this.sections)) {
    this.totalLessons = this.sections.reduce(
      (sum, sec) => sum + (sec.lessons ? sec.lessons.length : 0),
      0
    );
    for (const sec of this.sections) {
      if (sec.lessons && Array.isArray(sec.lessons)) {
        for (const lsn of sec.lessons) {
          if (lsn.embedUrl) {
            lsn.embedUrl = formatEmbedUrl(lsn.embedUrl);
          }
        }
      }
    }
  }
  if (typeof next === 'function') {
    next();
  }
});

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);
export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
