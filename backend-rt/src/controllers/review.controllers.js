import Review from '../models/review.model.js';
import Movie from '../models/movie.model.js';
import Series from '../models/series.model.js';
// import mongoose from 'mongoose';

class ReviewController {
  
  async createReview(req, res) {
    const { content, author, movie, series, rating } = req.body;

    if (!content || !author || (!movie && !series) || !rating) {
      return res.status(400).json({ message: 'Se requiere contenido, autor, película o serie y calificación.' }); // Contenido es una relación
    }

    try {
      
      const newReview = new Review({ content, author, movie, series, rating });
      await newReview.save();

      let updatedItem;
      if (movie ) {
        
        updatedItem = await Movie.findByIdAndUpdate(
          movie,
          { $push: { reviews: newReview._id } },
          { new: true }
        ).populate('reviews');

      } else if (series) {
        
        updatedItem = await Series.findByIdAndUpdate(
          series,
          { $push: { reviews: newReview._id } },
          { new: true }
        ).populate('reviews');

        if (!updatedItem) {
          return res.status(404).json({ message: 'Serie no encontrada' });
        }
      }

      res.status(201).json({ message: 'Reseña publicada exitosamente', newReview, updatedItem });
    } catch (err) {
      console.error('Error al crear la reseña:', err);
      res.status(500).json({ message: 'Error al crear la reseña', error: err.message });
    }
  }

  async getReviews(req, res) {
    const { movieId, seriesId } = req.params;
    console.log(movieId, seriesId);

    try {
      let reviews;
      if (movieId) {
        reviews = await Review.find({ movie: movieId }).populate('author').populate('movie');
      } else if (seriesId) {
        reviews = await Review.find({ series: seriesId }).populate('author').populate('series');
      } else {
        return res.status(400).json({ message: 'Se requiere identificación de la película o de la serie' });
      }

      if (!reviews || reviews.length === 0) {
        return res.status(404).json({ message: 'No se encontraron reseñas para esta película o serie.' });
      }

      res.status(200).json(reviews);
    } catch (err) {
      console.error('Error al obtener las reseñas:', err);
      res.status(500).json({ message: 'Error al obtener las reseñas', error: err.message });
    }
  }

   
   async getReviewsByMovie(req, res) {
    const { movieId } = req.params;

    try {
      const reviews = await Review.find({ movie: movieId }).populate('author').populate('movie')

      if (!reviews || reviews.length === 0) {
        const reviews = await Review.find({ series: movieId }).populate('author').populate('movie')
        res.status(200).json(reviews);
      }else{
        return res.status(404).json({ message: 'No se encontraron reseñas para este autor y/o película.' });
      }

      res.status(200).json(reviews);
    } catch (err) {
      console.error('Error al obtener reseñas por película:', err);
      res.status(500).json({ message: 'Error al obtener reseñas por película', error: err.message });
    }
  }
  
 
 async getReviewsByAuthorAndItem(req, res) {
  const { authorId, movieId, seriesId } = req.params;

  try {
    let reviews;
    if (movieId) {
      reviews = await Review.find({ author: authorId, movie: movieId }).populate('author').populate('movie');
    } else if (seriesId) {
      reviews = await Review.find({ author: authorId, series: seriesId }).populate('author').populate('series');
    } else {
      return res.status(400).json({ message: 'Se requiere la id de la película o de la serie' });
    }

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reseñas para este autor y artículo.' });
    }

    res.status(200).json(reviews);
  } catch (err) {
    console.error('Error al obtener reseñas por autor y artículo:', err);
    res.status(500).json({ message: 'Error al obtener reseñas por autor y artículo', error: err.message });
  }
}

  
  async getReviewById(req, res) {
    try {
      const { reviewId } = req.params;
      const review = await Review.findById(reviewId).populate('author').populate('movie');

      if (!review) {
        return res.status(404).json({ message: 'Reseña no encontrada' });
      }

      res.status(200).json(review);
    } catch (err) {
      console.error('Error al obtener la reseña:', err);
      res.status(500).json({ message: 'Error al obtener la reseña' });
    }
  }

  
  async getReviewAuthor(req, res) {
    try {
      const { authorID } = req.params;
      const reviews = await Review.find({ authorID }).populate('author').populate('movie');

      if (!reviews || reviews.length === 0) {
        return res.status(404).json({ message: 'No se encontraron reseñas para este autor' });
      }

      res.status(200).json(reviews);
    } catch (err) {
      console.error('Error al obtener reseñas por autor:', err);
      res.status(500).json({ message: 'Error al obtener reseñas por autor' });
    }
  }

  
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { content, author, movie, rating } = req.body;

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { content, author, movie, rating },
        { new: true } 
      );

      if (!updatedReview) {
        return res.status(404).json({ message: 'Reseña no encontrada' });
      }

      res.status(200).json({ message: 'Reseña actualizada exitosamente', updatedReview });
    } catch (err) {
      console.error('Error al actualizar la reseña:', err);
      res.status(500).json({ message: 'Error al actualizar la reseña' });
    }
  }

  
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const deletedReview = await Review.findByIdAndDelete(reviewId);

      if (!deletedReview) {
        return res.status(404).json({ message: 'Reseña no encontrada' });
      }

      res.status(200).json({ message: 'Reseña eliminada exitosamente' });
    } catch (err) {
      console.error('Error al eliminar la reseña:', err);
      res.status(500).json({ message: 'Error al eliminar la reseña'});
    }
  }
} // Probar los elementos del CRUD de reseñas


export default new ReviewController();