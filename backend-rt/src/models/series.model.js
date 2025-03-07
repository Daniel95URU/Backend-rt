import mongoose from 'mongoose';

const seriesSchema = new mongoose.Schema({
  seriesId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  banner: {
    type: String
  },
  caratula: {
    type: String
  },
  duration: {
    type: Number
  },
  briefDescription: {
    type: String
  },
  description: {
    type: String
  },
  releaseDate: {
    type: Date
  },
  genre: {
    type: [String]
  },
  director: {
    type: String
  },
  createdBy: {
    type: String
  },
  cast: [{
    id: Number,
    name: String,
    role: String,
    profile_path: String,
    character: String
  }],
  ratings: {
    type: Number
  },

  categories: {
    type: [String]
  },
  budget: {
    type: Number
  },
  originalLanguage: {
    type: String
  }
}, {
  timestamps: true
});

const SeriesModel = mongoose.model('Series', seriesSchema);

export default SeriesModel;