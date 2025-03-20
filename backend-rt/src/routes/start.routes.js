import express from 'express';
import { register, createLogin, resetPassword, checkResetToken, savePassword, eraseAccount,getUserInfoById } from '../controllers/auth.controllers.js';
import Movie from '../controllers/movie.controllers.js'; 
import Series from '../controllers/series.controllers.js'
import ReviewController from '../controllers/review.controllers.js';

const router = express.Router();

router.use(express.json()); 

// Autorización
router.get('/', (req, res) => {
  res.send('You have to log in.');
});
router.post('/register', register);
router.post('/login', createLogin);
router.post('/resetPassword', resetPassword);
router.post('/checkReset', checkResetToken);
router.post('/newPassword', savePassword);
router.delete('/deleteUser', eraseAccount);
router.get('/getUserInfo/:userId', getUserInfoById); 

// Películas
router.get('/trendingMovies', Movie.getTrendingMovies.bind(Movie)); 
router.get('/trendingWeekMovies', Movie.getTrendingWeekMovies.bind(Movie));
router.post('/createMovie', Movie.createMovie.bind(Movie)); 
router.get('/popularMovies', Movie.getPopularMovies.bind(Movie));
router.get('/getSpecificMovie/:nameMovie', Movie.getSpecificMovie.bind(Movie));
router.post('/yourWatchlist', Movie.addToWatchlist.bind(Movie));
router.get('/getWatchlist/:personId', Movie.getWatchlist.bind(Movie)); 
router.get('/getLastSeen/:personId', Movie.getLastSeen.bind(Movie));
router.get('/moviesInTheater', Movie.moviesInTheater.bind(Movie)); 
router.get('/getMovieByIdAndTitle/:movieId/:title', Movie.getMovieByIdAndTitle.bind(Movie));
router.post('/updateLastSeen', Movie.updateLastSeen.bind(Movie)); 
router.delete('/removeFromWatchlist', Movie.removeFromWatchlist.bind(Movie)); 
router.get('/isMovieInLastSeen/:userId/:movieId', Movie.isMovieInLastSeen.bind(Movie)); 
router.get('/getMovieById/:id', Movie.getMovieById.bind(Movie)); 
router.get('/searchMulti', Movie.searchMulti.bind(Movie));
router.delete('/removeFromWatchlist', Movie.removeFromWatchlist.bind(Movie));
router.get('/discoverMovies', Movie.discoverMovies.bind(Movie))

// Series 
router.post('/createSeries', Series.saveSeries.bind(Series));
router.post('/addToWatchlistSeries', Series.addToWatchlist.bind(Series));
router.post('/addLastSeenSeries', Series.addLastSeen.bind(Series));
router.get('/watchlistSeries/:personId', Series.getWatchlist.bind(Series));
router.get('/lastSeenSeries/:personId', Series.getLastSeen.bind(Series));
router.get('/popularSeries', Series.getPopularSeries.bind(Series));
router.get('/topRatedSeries', Series.getTopRatedSeries.bind(Series));
router.get('/actionAdventureSeries', Series.getActionAdventureSeries.bind(Series));
router.get('/animationSeries', Series.getAnimationSeries.bind(Series));
router.get('/dramaSeries', Series.getDramaSeries.bind(Series));
router.get('/comedySeries', Series.getComedySeries.bind(Series));
router.get('/getSeriesByIdAndTitle/:seriesId/:title', Series.getSeriesByIdAndTitle.bind(Series));
router.post('/updateLastSeenSeries', Series.updateLastSeen.bind(Series)); 
router.delete('/removeFromWatchlistSeries', Series.removeFromWatchlist.bind(Series)); 
router.get('/isSeriesInLastSeen/:userId/:seriesId', Series.isSeriesInLastSeen.bind(Series)); 
router.get('/getSeriesById/:id', Series.getSeriesById.bind(Series));
router.get('/getUpcomingPopularSeries', Series.getUpcomingPopularSeries.bind(Series));
router.delete('/removeFromWatchlistSeries', Series.removeFromWatchlist.bind(Series)); 

// Reseñas
router.post('/createReview', ReviewController.createReview.bind(ReviewController));
router.get('/reviews', ReviewController.getReviews.bind(ReviewController));
router.get('/review/:reviewId', ReviewController.getReviewById.bind(ReviewController));
router.get('/reviews/movie/:movieId', ReviewController.getReviews.bind(ReviewController)); 
router.get('/reviews/series/:seriesId', ReviewController.getReviews.bind(ReviewController)); 
router.get('/reviews/author/:authorId', ReviewController.getReviewAuthor.bind(ReviewController));
router.put('/review/:reviewId', ReviewController.updateReview.bind(ReviewController));
router.delete('/review/:reviewId', ReviewController.deleteReview.bind(ReviewController));
router.get('/reviews/author/:authorId/movie/:movieId', ReviewController.getReviewsByAuthorAndItem.bind(ReviewController));
router.get('/reviews/author/:authorId/series/:seriesId', ReviewController.getReviewsByAuthorAndItem.bind(ReviewController)); 

export default router;