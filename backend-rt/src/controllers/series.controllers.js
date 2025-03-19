import fetch from "node-fetch";
import SeriesModel from "../models/series.model.js";
import User from "../models/user.model.js";

class Series {


  async saveSeries(req, res) {
    const { seriesId } = req.body; 
    const seriesUrl = `https://api.themoviedb.org/3/tv/${seriesId}?language=en-US`;
    const castUrl = `https://api.themoviedb.org/3/tv/${seriesId}/credits?language=en-US`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMTAwOTM2MS41MDY2MjY4LCJzdWIiOiI2NzI2ZWRmODU1NDA4M2E1NmEwZDVkNGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0RZFQ_u-V1-I9RU-Kk6Qt-HB2v-MASBmHryZu9pLLD8'
      }
    };

    try {
  
      const seriesResponse = await fetch(seriesUrl, options);
      const seriesData = await seriesResponse.json();

      const castResponse = await fetch(castUrl, options);
      const castData = await castResponse.json();

      const cast = castData.cast ? castData.cast.slice(0, 10).map(member => ({
        id: member.id, 
        name: member.name,
        role: member.character,
        profile_path: member.profile_path,
        character: member.character,
      })) : [];

      const newSeries = new SeriesModel({ // Nuevas series
        seriesId: seriesData.id, 
        title: seriesData.original_name,
        banner: seriesData.poster_path,
        caratula: seriesData.poster_path,
        duration: seriesData.episode_run_time ? seriesData.episode_run_time[0] : null,
        briefDescription: seriesData.tagline,
        description: seriesData.overview,
        releaseDate: seriesData.first_air_date,
        genre: seriesData.genres ? seriesData.genres.map(genre => genre.name) : [],
        director: seriesData.created_by ? seriesData.created_by.map(creator => creator.name).join(', ') : '',
        createdBy: seriesData.created_by ? seriesData.created_by.map(creator => creator.name).join(', ') : '',
        cast: cast,
        ratings: seriesData.vote_average,
        categories: seriesData.genres ? seriesData.genres.map(genre => genre.name) : [],
        budget: seriesData.budget,
        originalLanguage: seriesData.original_language,
      });

      const savedSeries = await newSeries.save();
      res.status(201).json({ message: "Serie creada con exito", series: savedSeries });
    } catch (error) {
      console.error("Error al crear la serie:", error);
      res.status(500).json({ message: "Error al crear la serie", error: error.message });
    }
  }

  async getSeriesById(req, res) {
    const { id } = req.params; 

    try {
      const series = await SeriesModel.findById(id);

      if (!series) {
        return res.status(404).json({ message: "Serie no encontrada" });
      }

      res.status(200).json(series);
    } catch (error) {
      console.error("Error al recuperar la serie:", error);
      res.status(500).json({ message: "Error al recuperar la serie", error: error.message });
    }
  }

 async updateLastSeen(req, res) {
  const { userId, seriesId } = req.body; 

  try {
    const series = await SeriesModel.findByIdAndUpdate(
      seriesId,
      { lastSeen: new Date() },
      { new: true }
    );

    if (!series) {
      return res.status(404).json({ message: "Error al recuperar la serie" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const lastSeenSeries = user.lastSeenSeries.find( //reutilización del código de ultima vista
      (item) => item.series && item.series.toString() === seriesId
    );

    if (lastSeenSeries) {
      lastSeenSeries.seenAt = new Date();
    } else {
      user.lastSeenSeries.push({ series: seriesId, seenAt: new Date() });
    }

    await user.save();

    res.status(200).json({ message: "Última actualización vista exitosamente", series, user });
  } catch (error) {
    console.error("Error al actualizar visto por última vez:", error);
    res.status(500).json({ message: "Error al actualizar visto por última vez", error: error.message });
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
      return res.status(404).json({ message: "No se encontraron próximas series de televisión populares" });
    }

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
      message: "Error al obtener las próximas series de televisión populares",
      error: error.message,
    });
  }
}

async removeFromWatchlist(req, res) {
  const { userId, seriesId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const seriesIndex = user.watchlistSeries.findIndex(
      (series) => series.toString() === seriesId
    );

    if (seriesIndex === -1) {
      return res.status(404).json({ message: "Error al recuperar la serie en los ver más tarde" });
    }

    user.watchlistSeries.splice(seriesIndex, 1);
    await user.save();

    res.status(200).json({ message: "Serie eliminada de la lista de seguimiento", watchlistSeries: user.watchlistSeries });
  } catch (error) {
    console.error("Error al eliminar la serie de la lista de seguimiento:", error);
    res.status(500).json({ message: "Error al eliminar la serie de la lista de seguimiento", error: error.message });
  }
}


   async isSeriesInLastSeen(req, res) {
    const { userId, seriesId } = req.params; 

    try {
      const user = await User.findById(userId).populate("lastSeenSeries");

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const seriesInLastSeen = user.lastSeenSeries.some(series => series._id.toString() === seriesId);

      if (!seriesInLastSeen) {
        return res.status(404).json({ message: "Error al recuperar la serie en la lista vista por última vez" });
      }

      res.status(200).json({ message: "La serie está en la lista de últimos vistos" });
    } catch (error) {
      console.error("Error al comprobar la serie en la lista de últimos vistos:", error);
      res.status(500).json({ message: "Error al comprobar la serie en la lista de últimos vistos", error: error.message });
    }
  }

  // Eliminar una serie de la lista de seguimiento del usuario (probar con un botón propio para remover de la lista)
  async removeFromWatchlist(req, res) {
    const { userId, seriesId } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const seriesIndex = user.watchlistSeries.findIndex(series => series.toString() === seriesId);

      if (seriesIndex === -1) {
        return res.status(404).json({ message: "Error al recuperar la serie en la lista de ver más tarde" });
      }

      user.watchlistSeries.splice(seriesIndex, 1);
      await user.save();

      res.status(200).json({ message: "Serie eliminada de la lista de ver más tarde", watchlistSeries: user.watchlistSeries });
    } catch (error) {
      console.error("Error al eliminar la serie de la lista de ver más tarde:", error);
      res.status(500).json({ message: "Error al eliminar la serie de la lista de ver más tarde", error: error.message });
    }
  }

 async getSeriesByIdAndTitle(req, res) {
  const { seriesId, title } = req.params; 

  try {
    const series = await SeriesModel.findOne({ seriesId, title });

    if (!series) {
      return res.status(404).json({ message: "Error al recuperar la serie" });
    }

    res.status(200).json(series);
  } catch (error) {
    console.error("Error al recuperar la serie:", error);
    res.status(500).json({ message: "Error al recuperar la serie", error: error.message });
  }
}

  async addToWatchlist(req, res) {
    const { userId, seriesId } = req.body;

    try {
      const user = await User.findById(userId).populate("watchlistSeries");
      const series = await SeriesModel.findOne({ seriesId });

      if (!user || !series) {
        return res.status(404).json({ message: "Error en el usuario al recuperar la serie en ver más tarde" });
      }

      user.watchlistSeries.push(series);

      if (user.watchlistSeries.length > 15) {
        user.watchlistSeries.shift();
      }

      await user.save();
      res.status(200).json({ message: "Serie añadida a la lista de ver más tarde", watchlistSeries: user.watchlistSeries });
    } catch (error) {
      console.error("Error al agregar la serie a la lista de ver más tarde:", error);
      res.status(500).json({ message: "Error al agregar la serie a la lista de ver más tarde", error: error.message });
    }
  }


  // async getWatchlist(req, res) {
  //   const { personId } = req.params;

  //   try {
  //     const user = await User.findById(personId).populate("watchlistSeries");

  //     if (!user) {
  //       return res.status(404).json({ message: "Usuario no encontrado" });
  //     }

  //     res.status(200).json({ watchlistSeries: user.watchlistSeries });
  //   } catch (error) {
  //     console.error("Error al obtener la lista de ver más tarde:", error);
  //     res.status(500).json({ message: "EError al obtener la lista de ver más tarde", error: error.message });
  //   }
  // }


  async getLastSeen(req, res) {
    const { personId } = req.params;

    try {
      const user = await User.findById(personId).populate("lastSeenSeries");

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.status(200).json({ lastSeenSeries: user.lastSeenSeries });
    } catch (error) {
      console.error("Error al obtener la última serie vista:", error);
      res.status(500).json({ message: "Error al obtener la última serie vista", error: error.message });
    }
  }

  async addLastSeen(req, res) {
    const { userId, seriesId } = req.body;

    try {
      const user = await User.findById(userId).populate("lastSeenSeries");
      const series = await SeriesModel.findOne({ seriesId });

      if (!user || !series) {
        return res.status(404).json({ message: "Error en el usuario al recuperar la última serie vista" });
      }

      user.lastSeenSeries.push(series);

      if (user.lastSeenSeries.length > 15) {
        user.lastSeenSeries.shift();
      }

      await user.save();
      res.status(200).json({ message: "Serie añadida a la lista de últimas vistas", lastSeenSeries: user.lastSeenSeries });
    } catch (error) {
      console.error("Error al agregar serie a la lista de últimas vistas:", error);
      res.status(500).json({ message: "Error al agregar serie a la lista de últimas vistas", error: error.message });
    }
  }

  // Fetch para obtener las series de televisión populares (Revisar porque a veces da errores)
  async getPopularSeries(req, res) {
    const url = "https://api.themoviedb.org/3/tv/popular?language=en-US";
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
      console.error("Error al obtener series de televisión populares:", error);
      res
        .status(500)
        .json({
          message: "Error al obtener series de televisión populares",
          error: error.message,
        });
    }
  }

//   async getTopRatedSeries(req, res) {
//     const url =
//       "https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=1";
//     const options = {
//       method: "GET",
//       headers: {
//         accept: "application/json",
//         Authorization:
//           "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMjM2MzA0NC4wMjA3NTQsInN1YiI6IjY3MjZlZGY4NTU0MDgzYTU2YTBkNWQ0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A36jP2inD2g3vtF4S9laLNNkF9YL0RW867OXvK1G_Nc",
//       },
//     };

//     try {
//       const response = await fetch(url, options);
//       const data = await response.json();
//       res.status(200).json(data);
//     } catch (error) {
//       console.error("Error al obtener las series de televisión mejor valoradas:", error);
//       res
//         .status(500)
//         .json({
//           message: "Error al obtener las series de televisión mejor valoradas",
//           error: error.message,
//         });
//     }
//   }
// // Por categorías
//   async getActionAdventureSeries(req, res) {
//     const url =
//       "https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=10759";
//     const options = {
//       method: "GET",
//       headers: {
//         accept: "application/json",
//         Authorization:
//           "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMjM2MzA0NC4wMjA3NTQsInN1YiI6IjY3MjZlZGY4NTU0MDgzYTU2YTBkNWQ0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A36jP2inD2g3vtF4S9laLNNkF9YL0RW867OXvK1G_Nc",
//       },
//     };

//     try {
//       const response = await fetch(url, options);
//       const data = await response.json();
//       res.status(200).json(data);
//     } catch (error) {
//       console.error("Error al obtener las series de TV de acción: ", error);
//       res
//         .status(500)
//         .json({
//           message: "Error al obtener las series de TV de acción",
//           error: error.message,
//         });
//     }
//   }

//   async getAnimationSeries(req, res) {
//     const url = 'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=16';
//     const options = {
//       method: 'GET',
//       headers: {
//         accept: 'application/json',
//         Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMjM2MzA0NC4wMjA3NTQsInN1YiI6IjY3MjZlZGY4NTU0MDgzYTU2YTBkNWQ0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A36jP2inD2g3vtF4S9laLNNkF9YL0RW867OXvK1G_Nc'
//       }
//     };
  
//     try {
//       const response = await fetch(url, options);
//       const data = await response.json();
//       res.status(200).json(data);
//     } catch (error) {
//       console.error("Error al obtener las series de TV animadas:", error);
//       res.status(500).json({
//         message: "Error al obtener las series de TV animadas ",
//         error: error.message,
//       });
//     }
//   }

  async getDramaSeries(req, res) {
    const url =
      "https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=18";
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMjM2MzA0NC4wMjA3NTQsInN1YiI6IjY3MjZlZGY4NTU0MDgzYTU2YTBkNWQ0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A36jP2inD2g3vtF4S9laLNNkF9YL0RW867OXvK1G_Nc",
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error al obtener las series de TV de drama:", error);
      res
        .status(500)
        .json({
          message: "Error al obtener las series de TV de drama",
          error: error.message,
        });
    }
  }

  async getComedySeries(req, res) {
    const url = 'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=35';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDZhMWU5Y2NkMTZmZjliYmRmZTZiNmVmNjhiYzAxYyIsIm5iZiI6MTczMjM2MzA0NC4wMjA3NTQsInN1YiI6IjY3MjZlZGY4NTU0MDgzYTU2YTBkNWQ0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A36jP2inD2g3vtF4S9laLNNkF9YL0RW867OXvK1G_Nc'
      }
    };
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error al obtener las series de televisión de comedia:", error);
      res.status(500).json({
        message: "Error al obtener las series de televisión de comedia",
        error: error.message,
      });
    }
  }

}

export default new Series();
