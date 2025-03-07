import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const movieSchema = new Schema(
  {
    movieId: {
      type: String,
      unique: true,    
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number, 
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    cast: [
      {
        name: {
          type: String,
          trim: true,
        },
        role: {
          type: String,
          trim: true,
        },
        profile_path: { 
          type: String,
          trim: true,
        },
      },
    ],
    ratings: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    myScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    categories: {
      type: [String],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

movieSchema.path('cast').validate(function (value) {
  return value.length <= 10;
}, 'El cast supera el límite de 10.');

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;