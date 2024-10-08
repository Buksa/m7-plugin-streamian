// TMDB Metadata Scout for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scout = function (query, type, maxPages) {
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var posterEndpoint = "https://image.tmdb.org/t/p/w500";
    var results = [];

    if (type === 'movie') {
        console.log("Processing movie query: " + query);
    
        // Match the movie title and year from the query
        var queryParts = query.match(/^(.*?)(?:\s\((\d{4})\))?$/i);
        console.log("Parsed query parts: " + JSON.stringify(queryParts));
    
        if (queryParts && queryParts.length > 1) {
            var movieTitle = queryParts[1].trim(); // Movie title
            var movieYear = queryParts[2]; // Movie year, if provided
    
            console.log("Movie Title: " + movieTitle + ", Year: " + movieYear);
    
            // Construct the API URL for searching movies
            var movieApiUrl = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&query=" + encodeURIComponent(movieTitle.toLowerCase());
            console.log("Movie API URL: " + movieApiUrl);
            
            // Fetch the movie data
            var movieResponse = http.request(movieApiUrl, { method: 'GET' });
            console.log("Movie API Response: " + movieResponse);
    
            var movieData = JSON.parse(movieResponse.toString());
            console.log("Decoded Movie Data: " + JSON.stringify(movieData));
    
            if (movieData.results && movieData.results.length > 0) {
                var movie = movieData.results[0];
                console.log("Found Movie: " + JSON.stringify(movie));
    
                // Check if the movie year matches if provided
                if (!movieYear || (movie.release_date && movie.release_date.split("-")[0] === movieYear)) {
                    console.log("Year matched or not provided: " + movieYear);
    
                    var movieDescription = movie.overview || "No description available";
                    var backdropUrl = movie.backdrop_path ? "https://image.tmdb.org/t/p/original" + movie.backdrop_path : "No backdrop available";
                    var voteAverage = movie.vote_average ? movie.vote_average.toString() : "No rating";
                    var releaseDate = movie.release_date || "No release date";
                    
                    // Fetching additional movie details including credits (cast, crew) and external_ids (for imdb_id)
                    var detailsApiUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "?api_key=" + apiKey + "&append_to_response=credits,external_ids";
                    var detailsResponse = http.request(detailsApiUrl, { method: 'GET' });
                    var detailsData = JSON.parse(detailsResponse.toString());
                    var runtime = detailsData.runtime ? detailsData.runtime.toString() + " Minutes" : "No runtime available";
                    var imdbId = detailsData.external_ids ? detailsData.external_ids.imdb_id : '';
    
                    console.log("IMDb ID: " + imdbId);
    
                    // Fetching the YouTube trailer thumbnail
                    var trailerApiUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "/videos?api_key=" + apiKey;
                    var trailerResponse = http.request(trailerApiUrl, { method: 'GET' });
                    var trailerData = JSON.parse(trailerResponse.toString());
                    var youtubetrailerthumbnail = trailerData.results && trailerData.results.length > 0 ? "https://img.youtube.com/vi/" + trailerData.results[0].key + "/maxresdefault.jpg" : "No trailer available";
                    
                    // Fetching the cast
                    var cast = "No cast available";
                    if (detailsData.credits && detailsData.credits.cast) {
                        var castMembers = [];
                        for (var i = 0; i < detailsData.credits.cast.length; i++) {
                            castMembers.push(detailsData.credits.cast[i].name);
                        }
                        cast = castMembers.join(", ");
                    }
    
                    // Fetching the crew
                    var crew = "No crew available";
                    if (detailsData.credits && detailsData.credits.crew) {
                        var crewMembers = [];
                        for (var j = 0; j < detailsData.credits.crew.length; j++) {
                            crewMembers.push(detailsData.credits.crew[j].name);
                        }
                        crew = crewMembers.join(", ");
                    }
    
                    console.log("Movie Description: " + movieDescription);
                    console.log("Backdrop URL: " + backdropUrl);
                    console.log("Vote Average: " + voteAverage);
                    console.log("Release Date: " + releaseDate);
                    console.log("Runtime: " + runtime);
                    console.log("YouTube Trailer Thumbnail: " + youtubetrailerthumbnail);
                    console.log("Cast: " + cast);
                    console.log("Crew: " + crew);
    
                    var item = backdropUrl + " -|- " + youtubetrailerthumbnail + " -|- " + releaseDate + " -|- " + voteAverage + " -|- " + runtime + " -|- " + movieDescription + " -|- " + cast + " -|- " + crew + " -|- " + imdbId;
    
                    results.push(item);
                } else {
                    console.log("Year does not match: " + movieYear + " !== " + (movie.release_date ? movie.release_date.split("-")[0] : "Unknown year"));
                }
            } else {
                console.log("No results found for movie query: " + movieTitle);
            }
        } else {
            console.log("Invalid query format: " + query);
        }
    }    

    if (type === 'episode') {
        console.log("Processing episode query: " + query);
        
        var queryParts = query.match(/^(.*?)\s(\d{4})\s(s\d{1,2}e\d{1,2})/i);
        console.log("Parsed query parts: " + JSON.stringify(queryParts));
    
        if (queryParts && queryParts.length === 4) {
            var showTitle = queryParts[1].trim();
            var showYear = queryParts[2];
            var seasonEpisode = queryParts[3];
    
            console.log("Show Title: " + showTitle + ", Year: " + showYear + ", Season/Episode: " + seasonEpisode);
    
            var showApiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(showTitle.toLowerCase());
            console.log("Show API URL: " + showApiUrl);
            
            var showResponse = http.request(showApiUrl, {method: 'GET'});
            console.log("Show API Response: " + showResponse);
            
            var showData = JSON.parse(showResponse.toString());
            console.log("Decoded Show Data: " + JSON.stringify(showData));
    
            if (showData.results && showData.results.length > 0) {
                var show = showData.results[0];
                console.log("Found Show: " + JSON.stringify(show));
    
                var showFirstAirDate = show.first_air_date ? show.first_air_date.split("-")[0] : null;
                console.log("Show First Air Date: " + showFirstAirDate);
                
                if (showFirstAirDate && showFirstAirDate === showYear) {
                    console.log("Year matched: " + showFirstAirDate + " === " + showYear);
                    
                    var seasonEpisodeMatch = seasonEpisode.match(/s(\d{1,2})e(\d{1,2})/i);
                    console.log("Season/Episode Match: " + JSON.stringify(seasonEpisodeMatch));
                    
                    if (seasonEpisodeMatch && seasonEpisodeMatch.length === 3) {
                        var season = seasonEpisodeMatch[1];
                        var episode = seasonEpisodeMatch[2];
    
                        console.log("Extracted Season: " + season + ", Episode: " + episode);
    
                        var episodeApiUrl = "https://api.themoviedb.org/3/tv/" + show.id + "/season/" + season + "/episode/" + episode + "?api_key=" + apiKey + "&append_to_response=external_ids";
                        console.log("Episode API URL: " + episodeApiUrl);
                        
                        var episodeResponse = http.request(episodeApiUrl, {method: 'GET'});
                        console.log("Episode API Response: " + episodeResponse);
                        
                        var episodeData = JSON.parse(episodeResponse.toString());
                        console.log("Decoded Episode Data: " + JSON.stringify(episodeData)); // Log the entire episode data
    
                        if (episodeData) {
                            console.log("Episode Data Found");
                            
                            var episodeDescription = episodeData.overview || "No description available";
                            var backdropUrl = show.backdrop_path ? "https://image.tmdb.org/t/p/original" + show.backdrop_path : "No backdrop available";
                            var episodeStill = episodeData.still_path ? "https://image.tmdb.org/t/p/w500" + episodeData.still_path : backdropUrl;
                            var voteAverage = episodeData.vote_average ? episodeData.vote_average.toString() : "No rating";
                            var imdbId = episodeData.external_ids && episodeData.external_ids.imdb_id ? episodeData.external_ids.imdb_id : "No IMDb ID available";
                            var episodeName = episodeData.name ? episodeData.name : '';
    
                            console.log("Episode Description: " + episodeDescription);
                            console.log("Episode Still: " + episodeStill);
                            console.log("Vote Average: " + voteAverage);
                            console.log("IMDb ID: " + imdbId);
    
                            var guestStars = "No guest stars"; // Default value
                            if (episodeData.guest_stars && episodeData.guest_stars.length > 0) {
                                guestStars = "";
                                for (var i = 0; i < episodeData.guest_stars.length; i++) {
                                    if (i > 0) guestStars += ", "; // Add comma for multiple guest stars
                                    guestStars += episodeData.guest_stars[i].name;
                                }
                            }
                            console.log("Guest Stars: " + guestStars);
                            
                            var recasedShowName = recaseShowTitle(showTitle);
                            
    
                            var item = backdropUrl + " -|- " + episodeStill + " -|- " + showFirstAirDate + " -|- " + voteAverage + " -|- " + guestStars + " -|- " + episodeDescription + " -|- " + showTitle + " " + seasonEpisode + " -|- " + imdbId + " -|- " + recasedShowName + " - " + episodeName ;
                            results.push(item);
                        }
                    }
                }
            }
        } else {
            console.log("Invalid query format: " + query);
        }
    }    

    if (type === 'show') {
        // Extract the title and the year from the query
        var yearMatch = query.match(/\((\d{4})\)$/);
        var year = yearMatch ? yearMatch[1] : null;
        var title = query.replace(/\(\d{4}\)$/, '').trim(); // Remove the year from the title

        // Build the TMDB API URL, including the year filter if available
        var apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(title);
        if (year) {
            apiUrl += "&first_air_date_year=" + year;
        }

        // Fetch the show from TMDB
        var response = http.request(apiUrl);
        var json = JSON.parse(response);

        if (json.results && json.results.length > 0) {
            // Get the first result (nearest match)
            var show = json.results[0];
            var showId = show.id;

            // Fetch seasons for the show
            var seasonApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "?api_key=" + apiKey;
            var seasonResponse = http.request(seasonApiUrl);
            var seasonJson = JSON.parse(seasonResponse);

            if (seasonJson.seasons && seasonJson.seasons.length > 0) {
                seasonJson.seasons.forEach(function (season) {
                    var seasonTitle = "Season " + season.season_number;
                    var icon = season.poster_path ? posterEndpoint + season.poster_path : '';
                    var item = seasonTitle + " -|- " + icon + " -|- season" + " -|- " + season.season_number + " -|- " + backdropUrl;
                    results.push(item);
                });
            }
        }
    }

    if (type === 'season') {
        // Extract the season number from the query (case-insensitive)
        var seasonMatch = query.match(/s(\d+)/i); // Match "s" followed by the season number, case-insensitive
        var seasonNumber = seasonMatch ? seasonMatch[1] : null;
    
        // Extract the year from the query (case-insensitive)
        var yearMatch = query.match(/\((\d{4})\)/i); // Match the year in parentheses, case-insensitive
        var year = yearMatch ? yearMatch[1] : null;
    
        // Extract the title by removing year and season from the query
        var title = query.replace(/\(\d{4}\)\s*s\d+/i, '').trim(); // Strip off the year and season number with more flexibility (case-insensitive)
    
        // Convert the title to title case for TMDB (capitalize the first letter of each word)
        var titleCased = title.replace(/\b\w/g, function(l){ return l.toUpperCase(); });
    
        // Debugging: Log extracted values to verify they are correct
        console.log("Query: " + query);
        console.log("Extracted Title: " + title);
        console.log("Title-Cased for TMDB: " + titleCased);
        console.log("Extracted Year: " + year);
        console.log("Extracted Season: " + seasonNumber);
    
        // Ensure both season number and year are found
        if (seasonNumber && year) {
            // Build the TMDB API URL
            var apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(titleCased);
            if (year) {
                apiUrl += "&first_air_date_year=" + year;
            }
    
            // Debug: Log the constructed URL
            console.log("TMDB API URL: " + apiUrl);
    
            // Fetch the show from TMDB
            var response = http.request(apiUrl);
            var json = JSON.parse(response);
    
            if (json.results && json.results.length > 0) {
                // Get the first result (nearest match)
                var show = json.results[0];
                var showId = show.id;
    
                // Fetch episodes for the specific season
                var episodeApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "?api_key=" + apiKey;
                
                // Debug: Log the constructed episode URL
                console.log("TMDB Episode API URL: " + episodeApiUrl);
    
                var episodeResponse = http.request(episodeApiUrl);
                var episodeJson = JSON.parse(episodeResponse);
    
                if (episodeJson.episodes && episodeJson.episodes.length > 0) {
                    episodeJson.episodes.forEach(function (episode) {
                        var episodeTitle = "S" + seasonNumber + "E" + episode.episode_number + " - " + episode.name;
                        var episodeDescription = episode.overview
                        var icon = episode.still_path ? posterEndpoint + episode.still_path : null;
                        var item = episodeTitle + " -|- " + icon + " -|- " + title + " " + year + " s" + seasonNumber + "e" + episode.episode_number + " -|- " + episodeDescription;
                        results.push(item);
                    });
                } else {
                    console.log("No episodes found for season " + seasonNumber);
                }
            } else {
                console.log("Show not found for query: " + query);
            }
        } else {
            console.log("Invalid query format for season type - Missing season number or year");
        }
    }    

    if (type === 'query') {
        var apiUrl;
        var maxPages = maxPages || 10; // Change this to get more or fewer pages
        var results = [];
        
        // Genre mapping (you can expand this or fetch from TMDB's genre API)
        var genreMap = {
            28: 'Action',
            12: 'Adventure',
            16: 'Animation',
            35: 'Comedy',
            80: 'Crime',
            18: 'Drama',
            14: 'Fantasy',
            27: 'Horror',
            878: 'Science Fiction',
            53: 'Thriller',
            // Add more genre mappings as needed
        };
        
        // Helper function to get genres as a string
        function getGenres(genreIds) {
            return genreIds && genreIds.length > 0
                ? genreIds.map(function(id) { return genreMap[id]; }).filter(Boolean).join(', ')
                : 'Unknown'; // Fallback if no genre or mapping is missing
        }
    
        // Fetch results from multiple pages
        for (var page = 1; page <= maxPages; page++) {
            // Check if query is for popular shows or movies
            if (query === 'popularshows') {
                apiUrl = "https://api.themoviedb.org/3/tv/popular?api_key=" + apiKey + "&page=" + page;
            } else if (query === 'popularmovies') {
                apiUrl = "https://api.themoviedb.org/3/movie/popular?api_key=" + apiKey + "&page=" + page;
            } else {
                // Default search query if not popular shows/movies
                apiUrl = "https://api.themoviedb.org/3/search/multi?api_key=" + apiKey + "&query=" + encodeURIComponent(query) + "&page=" + page;
            }
        
            var response = http.request(apiUrl);
            var json = JSON.parse(response);
    
            // Process TMDB results if any
            if (json.results && json.results.length > 0) {
                var movies = [];
                var tvShows = [];
        
                // Categorize results into movies and TV shows
                json.results.forEach(function(item) {
                    if (item.media_type === 'movie' || query === 'popularmovies') {
                        movies.push(item);
                    } else if (item.media_type === 'tv' || query === 'popularshows') {
                        tvShows.push(item);
                    }
                });
        
                // Process movies if there are any
                if (movies.length > 0) {
                    movies.forEach(function(item) {
                        var type = 'movie';
                        var title = item.title || item.original_title;
                        var icon = item.poster_path ? posterEndpoint + item.poster_path : '';
                        var releaseDate = item.release_date ? item.release_date.substring(0, 4) : 'Unknown';
                        var genres = getGenres(item.genre_ids); // Get genres
                        title = title + " (" + releaseDate + ")";
                        var itemString = title + " -|- " + icon + " -|- " + type + " -|- " + encodeURIComponent(genres);
                        results.push(itemString);
                    });
                }
        
                // Process TV shows if there are any
                if (tvShows.length > 0) {
                    tvShows.forEach(function(item) {
                        var type = 'show';
                        var title = item.name || item.original_name;
                        var icon = item.poster_path ? posterEndpoint + item.poster_path : '';
                        var firstAirDate = item.first_air_date ? item.first_air_date.substring(0, 4) : 'Unknown';
                        var genres = getGenres(item.genre_ids); // Get genres
                        title = title + (firstAirDate ? " (" + firstAirDate + ")" : '');
                        var itemString = title + " -|- " + icon + " -|- " + type + " -|- " + encodeURIComponent(genres);
                        results.push(itemString);
                    });
                }
            }
        }
        return results;
    }
    return results;
};