import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password_user: {
    type: String,
    required: true,
  },
  email_user: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String, 
  },
  resetTokenExpires: {
    type: Date, 
  },
  watchlist: [{
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastSeenMovies: [{
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie'
    },
    seenAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchlistSeries: [{
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastSeenSeries: [{
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series'
    },
    seenAt: {
      type: Date,
      default: Date.now
    }
  }],
  movieLastSeen: {
    type: Date, 
  }
});

const User = mongoose.model('User', userSchema);
export default User;