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

 async isMovieInLastSeen(req, res) {
  const { userId, movieId } = req.params; 

  try {
    const user = await User.findById(userId).populate("lastSeenMovies");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const movieInLastSeen = user.lastSeenMovies.some(
      (movie) => movie._id.toString() === movieId
    );

    if (!movieInLastSeen) {
      return res
        .status(404)
        .json({ message: "Película no encontrada en la lista de últimas vistas" });
    }

    res.status(200).json({ message: "La película está en la lista de últimos vistos" });
  } catch (error) {
    console.error("Error al comprobar la película en la lista de última vista:", error);
    res
      .status(500)
      .json({
        message: "Error al comprobar la película en la lista de última vista:",
        error: error.message,
      });
  }
}

// Obtener una sola película por ID
async saveOurMovies(req, res) {
  const { userId, movieId } = req.body; 

  try {
    const user = await User.findById(userId).populate("lastSeenMovies");
    const movie = await Movie.findOne({ movieId: movieId });

    if (!user || !movie) {
      return res.status(404).json({ message: "Usuario o película no encontrados" });
    }

    // Añade la película a las últimas películas vistas por el usuario
    user.lastSeenMovies.push(movie);
    if (user.lastSeenMovies.length > 15) {
      user.lastSeenMovies.shift(); // Remove the oldest movie
    }

    await user.save();

    res.status(200).json({
      message: "Película añadida a las últimas películas vistas",
      lastSeenMovies: user.lastSeenMovies,
    });
  } catch (error) {
    console.error("Error al agregar película a las últimas películas vistas:", error);
    res.status(500).json({
      message: "Error al agregar película a las últimas películas vistas",
      error: error.message,
    });
  }
}

// Obtener las últimas películas vistas por el usuario con detalles completos de la película
async getLastSeen(req, res) {
  const { personId } = req.params;

  try {
    const user = await User.findById(personId).populate({
      path: "lastSeenMovies.movie",
      model: "Movie",
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Completa los detalles de la película para cada película vista por última vez
    const lastSeenMovies = user.lastSeenMovies.map((lastSeen) => ({
      _id: lastSeen._id,
      seenAt: lastSeen.seenAt,
      movie: lastSeen.movie,
    }));

    res.status(200).json({ lastSeenMovies });
  } catch (error) {
    console.error("Error fetching las últimas películas vistas:", error);
    res
      .status(500)
      .json({
        message: "Error fetching las últimas películas vistas:",
        error: error.message,
      });
  }
}

    // Buscar películas y shows de televisión
    async searchMulti(req, res) {
      const { query } = req.query; 
  
      if (!query) {
        return res.status(400).json({ message: "El parámetro de la query es obligatorio" });
      }
  
      const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI'
        }
      };
  
      try {
        const response = await fetch(url, options);
        const data = await response.json();
  
        // Filtrar los campos obligatorios
        const filteredResults = data.results.map(item => ({
          movieId: item.id,
          name: item.name || item.title,
          overview: item.overview,
          poster_path: item.poster_path,
          media_type: item.media_type,
          popularity: item.popularity,
          first_air_date: item.first_air_date || item.release_date,
          gen_id:item.genre_ids,
          vote_average: item.vote_average,
        }));
  
        res.status(200).json(filteredResults);
      } catch (error) {
        console.error("Error al obtener los resultados de la búsqueda:", error);
        res.status(500).json({
          message: "Error al obtener los resultados de la búsqueda",
          error: error.message,
        });
      }
    }

// TENDENCIAS
async getTrendingMovies(req, res) {
  const url = "https://api.themoviedb.org/3/trending/all/day?language=en-US";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener las películas en tendencia:", error);
    res.status(500).json({
      message: "Error al obtener las películas en tendencia",
      error: error.message,
    });
  }
}

// TENDENCIAS (semanales)
async getTrendingWeekMovies(req, res) {
  const url = "https://api.themoviedb.org/3/trending/all/week?language=en-US";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener las películas en tendencia:", error);
    res.status(500).json({
      message: "Error al obtener las películas en tendencia:",
      error: error.message,
    });
  }
}

// Actualizar una película por ID
async updateMovie(req, res) {
  try {
    const { movieId } = req.params;
    const {
      title,
      banner,
      caratula,
      duration,
      briefDescription,
      description,
      releaseDate,
      genre,
      director,
      createdBy,
      cast,
      ratings,
      categories,
      budget,
      originalLanguage,
    } = req.body;

    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      {
        title,
        banner,
        caratula,
        duration,
        briefDescription,
        description,
        releaseDate,
        genre,
        director,
        createdBy,
        cast,
        ratings,
        categories,
        budget,
        originalLanguage,
      },
      { new: true } 
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: "Película no encontrada" });
    }

    res
      .status(200)
      .json({ message: "Película actualizada exitosamente", movie: updatedMovie });
  } catch (error) {
    console.error("Error al actualizar la película:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar la película", error: error.message });
  }
}

// obtener todas las películas populares
async getPopularMovies(req, res) {
  const url = "https://api.themoviedb.org/3/movie/popular?language=en-US";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener películas populares:", error);
    res.status(500).json({
      message: "Error al obtener películas populares:",
      error: error.message,
    });
  }
}

// obtener las películas mejor valoradas (lista según usuarios)
async getTopRatedMovies(req, res) {
  const url = "https://api.themoviedb.org/3/movie/top_rated?language=en-US";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener las películas mejor valoradas:", error);
    res.status(500).json({
      message: "Error al obtener las películas mejor valoradas:",
      error: error.message,
    });
  }
}
async discoverMovies(req, res) {
  const url = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&release_date.gte=2024-01-01&sort_by=popularity.desc';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8'
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener las películas descubiertas antes:", error);
    res.status(500).json({
      message: "Error al obtener las películas descubiertas antes:",
      error: error.message,
    });
  }
}

async getUpcomingPopularSeries(req, res) {
  const url = 'https://api.themoviedb.org/3/discover/tv?first_air_date.gte=2024-01-01&include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8'
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return res.status(404).json({ message: "No se encontraron las próximas series de televisión " });
    }

    // Filtrar los campos obligatorios
    const filteredResults = data.results.map(item => ({
      name: item.name,
      overview: item.overview,
      poster_path: item.poster_path,
      media_type: item.media_type,
      popularity: item.popularity,
      first_air_date: item.first_air_date,
    }));

    res.status(200).json(filteredResults);
  } catch (error) {
    console.error("Error al obtener las próximas series de televisión populares:", error);
    res.status(500).json({
      message: "Error al obtener las próximas series de televisión populares:", //prueba fetch 
      error: error.message,
    });
  }
}

// Guardar una película en la Watchlist del usuario
async addToWatchlist(req, res) {
  const { userId, movieId } = req.body; 

  try {
    const user = await User.findById(userId).populate("watchlist");
    const movie = await Movie.findOne({ movieId: movieId });

    if (!user || !movie) {
      return res.status(404).json({ message: "Usuario o película no encontrados" });
    }

 // Agrega la película a las últimas películas vistas por el usuario
    user.watchlist.push(movie);

   //  El Array no debe exceder las 15 películas para que se mantenga el orden y no se desborde (aplicalo en todo)
    if (user.watchlist.length > 15) {
      user.watchlist.shift(); //Eliminar la película más antigua
    }

    await user.save();

    res.status(200).json({
      message: "Película añadida a la lista de películas para ver",
      lastSeenMovies: user.watchlist,
    });
  } catch (error) {
    console.error("Error al agregar película para ver películas:", error);
    res.status(500).json({
      message: "Error al agregar película para ver películas",
      error: error.message,
    });
  }
}

// Eliminar una película de la Watchlist del usuario (CR)
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
      return res.status(404).json({ message: "Película no encontrada en la lista de seguimiento" });
    }

    user.watchlist.splice(movieIndex, 1);
    await user.save();

    res.status(200).json({ message: "Película eliminada de la lista de seguimiento", watchlist: user.watchlist });
  } catch (error) {
    console.error("Error al eliminar la película de la lista de seguimiento:", error);
    res.status(500).json({ message: "Error al eliminar la película de la lista de seguimiento", error: error.message });
  }
}

// Obtener todas las películas de la Watchlist para un usuario.
async getWatchlist(req, res) {
  const { personId } = req.params; 

  try {
    const user = await User.findById(personId).populate("watchlist");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ watchlist: user.watchlist });
  } catch (error) {
    console.error("Error al obtener la lista de seguimiento:", error);
    res
      .status(500)
      .json({ message: "Error al obtener la lista de seguimiento", error: error.message });
  }
}

async addLastSeen(req, res) {
  const { userId, movieId } = req.body; 

  try {
    const user = await User.findById(userId).populate("lastSeenMovies");
    const movie = await Movie.findById(movieId);

    if (!user || !movie) {
      return res.status(404).json({ message: "Usuario o película no encontrados" });
    }

    // Agrega la película a las últimas películas vistas por el usuario
    user.lastSeenMovies.push(movie);
    if (user.lastSeenMovies.length > 15) {
      user.lastSeenMovies.shift(); 
    }

    await user.save();

    res
      .status(200)
      .json({
        message: "Película añadida a las últimas películas vistas",
        lastSeenMovies: user.lastSeenMovies,
      });
  } catch (error) {
    console.error("Error al agregar película a las últimas películas vistas:", error);
    res
      .status(500)
      .json({
        message: "Error al agregar película a las últimas películas vistas",
        error: error.message,
      });
  }
}

// Obtener todas las últimas películas vistas para un usuario
async getLastSeen(req, res) {
  const { personId } = req.params; 

  try {
    const user = await User.findById(personId).populate("lastSeenMovies");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ lastSeenMovies: user.lastSeenMovies });
  } catch (error) {
    console.error("Error al recuperar las últimas películas vistas:", error);
    res
      .status(500)
      .json({
        message: "Error al recuperar las últimas películas vistas",
        error: error.message,
      });
  }
}

//Buscar una película por nombre
async getSpecificMovie(req, res) {
  const { nameMovie } = req.params;
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    nameMovie
  )}&language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMDk4ODMyOC4xODI2MDA1LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.teR3vdfItSFXOHQsLQAdjiG0cos3Owbtf2cjyvKjTDI",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "Película no encontrada" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al buscar la película:", error);
    res
      .status(500)
      .json({ message: "Error al buscar la película", error: error.message });
  }
}

async moviesInTheater(req, res) {
  const url =
    "https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "No se encontraron películas" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al obtener películas en los cines:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener películas en los ciness",
        error: error.message,
      });
  }
}

// Categorias (probar un controller de categorias)
async getActionMoviesByRating(req, res) {
  const url =
    "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=vote_average.desc&vote_count.gte=10&with_genres=28";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "No se encontraron películas" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al obtener películas de acción por clasificación:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener películas de acción por clasificación",
        error: error.message,
      });
  }
}

async getComedyMoviesByRating(req, res) {
  const url =
    "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=vote_average.desc&vote_count.gte=10&with_genres=35";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "No se encontraron películas" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al obtener películas de comedia por clasificación:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener películas de comedia por clasificación",
        error: error.message,
      });
  }
}

async getAnimatedMoviesByRating(req, res) {
  const url =
    "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=vote_average.desc&vote_count.gte=10&with_genres=16";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "No se encontraron películas" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al obtener películas animadas por clasificación:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener películas animadas por clasificación",
        error: error.message,
      });
  }
}

async getHorrorMoviesByRating(req, res) {
  const url =
    "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=vote_average.desc&vote_count.gte=10&with_genres=27";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: "No se encontraron películas" });
    }

    res.status(200).json(data.results);
  } catch (error) {
    console.error("Error al obtener películas de terror por clasificación:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener películas de terror por clasificación",
        error: error.message,
      });
  }
}
}

export default new Movies();
