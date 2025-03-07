import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    content: {
      type: String,
      required: true, 
      trim: true,    
    },
    author: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',                         
      required: true,                    
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Movie',                         
      required: true,                     
    },
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
    },
    rating: {
      type: Number,
      required: true,
      min: 0,        
      max: 100,       
    },
  },
  {
    timestamps: true, 
  }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;