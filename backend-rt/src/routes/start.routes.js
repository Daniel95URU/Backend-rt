import express from 'express';
import { register, createLogin, resetPassword, checkResetToken, savePassword, eraseAccount,getUserInfoById } from '../controllers/auth.controllers.js';
import Movie from '../controllers/movie.controllers.js'; 

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

export default router;