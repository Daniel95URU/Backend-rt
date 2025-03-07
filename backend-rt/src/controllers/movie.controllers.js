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

 
}

export default new Movies();
