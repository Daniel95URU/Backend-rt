import fetch from "node-fetch";
import Movie from "../models/movie.model.js";

class Movies {
  async createMovie(req, res) {
    const { movieId } = req.body; 
    const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
    const castUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
      },
    };

    try {
      const movieResponse = await fetch(movieUrl, options);
      const movieData = await movieResponse.json();

      const castResponse = await fetch(castUrl, options);
      const castData = await castResponse.json();

      const cast = castData.cast
        ? castData.cast.slice(0, 10).map((member) => ({
            id: member.id, 
            name: member.name,
            role: member.character,
            profile_path: member.profile_path, 
          }))
        : [];

      const newMovie = new Movie({
        movieId: movieData.id, 
        title: movieData.original_title,
        banner: movieData.poster_path,
        caratula: movieData.poster_path,
        duration: movieData.runtime,
        briefDescription: movieData.tagline,
        description: movieData.overview,
        releaseDate: movieData.release_date,
        genre: movieData.genres
          ? movieData.genres.map((genre) => genre.name)
          : [],
        director: movieData.production_companies
          ? movieData.production_companies
              .map((company) => company.name)
              .join(", ")
          : "",
        createdBy: movieData.production_companies
          ? movieData.production_companies
              .map((company) => company.name)
              .join(", ")
          : "",
        cast: cast,
        ratings: movieData.vote_average,
        categories: movieData.genres
          ? movieData.genres.map((genre) => genre.name)
          : [],
        budget: movieData.budget,
        originalLanguage: movieData.original_language,
      });

      const savedMovie = await newMovie.save();
      res
        .status(201)
        .json({ message: "Película añadida", movie: savedMovie });
    } catch (error) {
      console.error("Error añadiendo la película:", error);
      res
        .status(500)
        .json({ message: "Error creando la película (server error)", error: error.message });
    }
  }
  async getMovieByIdAndTitle(req, res) {
    const { id, title } = req.params; 

    try {
      const movie = await Movie.findOne({ id, title });

      if (!movie) {
        return res.status(404).json({ message: "película no encontrada" });
      }

      res.status(200).json(movie);
    } catch (error) {
      console.error("Error al obtener los datos de la película:", error);
      res
        .status(500)
        .json({ message: "Error fetching", error: error.message });
    }
  }

  async getMovieById(req, res) {
    const { id } = req.params; 

    try {
      const movie = await Movie.findById(id);

      if (!movie) {
        return res.status(404).json({ message: "Película no encontrada" });
      }

      res.status(200).json(movie);
    } catch (error) {
      console.error("Error al solicitar los datos de películas:", error);
      res
        .status(500)
        .json({ message: "Error fetching", error: error.message });
    }
  }

  async updateLastSeen(req, res) { //Para las películas recientes (consultar la api)
    const { userId, movieId } = req.body; 

    try {

      const movie = await Movie.findByIdAndUpdate(
        movieId,
        { lastSeen: new Date() },
        { new: true }
      );

      if (!movie) {
        return res.status(404).json({ message: "Película no enconrada" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User no encontrado" });
      }

      const lastSeenMovie = user.lastSeenMovies.find(
        (movie) => movie.movie && movie.movie.toString() === movieId
      );

      if (lastSeenMovie) {
        lastSeenMovie.seenAt = new Date();
      } else {
        user.lastSeenMovies.push({ movie: movieId, seenAt: new Date() });
      }

      await user.save();

      res
        .status(200)
        .json({ message: "Last Seen actualizado correctamente", movie, user });
    } catch (error) {
      console.error("Error actualizando last seen:", error);
      res
        .status(500)
        .json({ message: "Error actualizando last seen", error: error.message });
    }
  }

  // Eliminar de la lista de ver más tarde (consulta la API está explicado mejor)
  async removeFromWatchlist(req, res) {
    const { userId, movieId } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const movieIndex = user.watchlist.findIndex(
        (movie) => movie.toString() === movieId
      );

      if (movieIndex === -1) {
        return res
          .status(404)
          .json({ message: "La película no fue encontrada en el Watchlist" });
      }

      user.watchlist.splice(movieIndex, 1);
      await user.save();

      res
        .status(200)
        .json({
          message: "Película removida de ver más tarde",
          watchlist: user.watchlist,
        });
    } catch (error) {
      console.error("Error eliminando de ver más tarde", error);
      res
        .status(500)
        .json({
          message: "Error eliminando de ver más tarde",
          error: error.message,
        });
    }
  }
 
}

export default new Movies();
