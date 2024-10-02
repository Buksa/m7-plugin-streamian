/*|---------------------------------------------------------------------------------------- TMDB Endpoints ----------------------------------------------------------------------------------------|*/

exports.fetchTMDBData = function (url) {
    try {
        var response = showtime.httpGet(url).toString();
        return JSON.parse(response);
    } catch (error) {
        console.log("[DEBUG]: Error fetching data from TMDB: " + error);
        return null;
    }
};

exports.fetchExternalIDs = function (type, itemId) {
    var apiUrl = type === 'movie'
        ? "https://api.themoviedb.org/3/movie/" + itemId + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06"
        : "https://api.themoviedb.org/3/tv/" + itemId + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06";
    
    var idData = tmdb.fetchTMDBData(apiUrl);
    return idData ? idData.imdb_id || '' : '';
};

exports.Search = function (page, query) {
    if (query === "richie rich") {
        query = "Ri¢hie Ri¢h"; // Change the query for TMDB
    }
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var apiUrl = "https://api.themoviedb.org/3/search/multi?api_key=" + apiKey + "&query=" + encodeURIComponent(query);
    var response = http.request(apiUrl);
    var json = JSON.parse(response);
    var fallbackImage = Plugin.path + "images/cvrntfnd.png";
    
    var tmdbResultsFound = false; // Flag to check if TMDB results are found
    
    // Process TMDB results if any
    if (json.results && json.results.length > 0) {
        tmdbResultsFound = true; // Set flag to true if TMDB results are found
        
        var movies = [];
        var tvShows = [];
        
        // Categorize results into movies and TV shows
        json.results.forEach(function (item) {
            if (item.media_type === 'movie') {
                movies.push(item);
            } else if (item.media_type === 'tv') {
                tvShows.push(item);
            }
        });
        
        // Process movies if there are any
        if (movies.length > 0) {
            page.appendItem("", "separator", { title: "        Movies                                                                                                                                                                                                                                                               " });
            page.appendItem("", "separator", { title: "" });
            movies.forEach(function (item) {
                var title = item.title;
                var posterPath = item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : fallbackImage;
                var releaseDate = item.release_date ? item.release_date.substring(0, 4) : '';
                var type = "movie";
                title = title + " (" + releaseDate + ")";
                
                // Fetch movie details to get the IMDb ID
                var movieDetailsUrl = "https://api.themoviedb.org/3/movie/" + item.id + "?api_key=" + apiKey + "&append_to_response=external_ids";
                var movieDetailsResponse = http.request(movieDetailsUrl);
                var movieDetails = JSON.parse(movieDetailsResponse);
                var imdbid = movieDetails.external_ids ? movieDetails.external_ids.imdb_id : '';
                
                // Construct URL based on autoplay setting
                var movieurl = service.autoPlay ? plugin.id + ":play:" + title + ":" + imdbid + ":" + type : plugin.id + ":details:" + title + ":" + imdbid + ":" + type ;
                
                // Append movie item to page
                var movieItem = page.appendItem(movieurl, "video", {
                    title: title,
                    icon: posterPath
                });
                
                movieItem.addOptAction('Add \'' + title + '\' to Your Library', (function(title, type, imdbid) {
                    return function() {
                        addToLibrary(title, type, imdbid);
                    };
                })(title, type, imdbid));
                
                movieItem.addOptAction('Remove \'' + title + '\' from My Favorites', (function(title) {
                    return function() {
                        removeFromLibrary(title);
                    };
                })(title));
            });
        }
        
        // Process TV shows if there are any
        if (tvShows.length > 0) {
            page.appendItem("", "separator", { title: "" });
            page.appendItem("", "separator", { title: "        Shows                                                                                                                                                                                                                                                               " });
            page.appendItem("", "separator", { title: "" });
            tvShows.forEach(function (item) {
                var title = item.name;
                var posterPath = item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : fallbackImage;
                
                // Append TV show item to page
                var tvShowItem = page.appendItem(plugin.id + ":season:" + encodeURIComponent(title), "video", {
                    title: title,
                    icon: posterPath,
                });
                
                // Add optional actions for TV show item
                var type = "show";
                tvShowItem.addOptAction('Add \'' + decodeURIComponent(title) + '\' to Your Library', (function(title, type) {
                    return function() {
                        var list = JSON.parse(library.list);
                        if (isFavorite(title)) {
                            popup.notify('\'' + decodeURIComponent(title) + '\' is already in Your Library.', 3);
                        } else {
                            popup.notify('\'' + decodeURIComponent(title) + '\' has been added to Your Library.', 3);
                            var libraryItem = {
                                title: encodeURIComponent(title),
                                type: type
                            };
                            list.push(libraryItem);
                            library.list = JSON.stringify(list);
                        }
                    };
                })(title, type));
                
                tvShowItem.addOptAction('Remove \'' + decodeURIComponent(title) + '\' from Your Library', (function(title, type) {
                    return function() {
                        var list = JSON.parse(library.list);
                        if (title) {
                            var decodedTitle = decodeURIComponent(title);
                            var initialLength = list.length;
                            list = list.filter(function(fav) {
                                return fav.title !== encodeURIComponent(decodedTitle);
                            });
                            if (list.length < initialLength) {
                                popup.notify('\'' + decodeURIComponent(decodedTitle) + '\' has been removed from Your Library.', 3);
                            } else {
                                popup.notify('Content not found in Your Library.', 3);
                            }
                            library.list = JSON.stringify(list);
                        } else {
                            popup.notify('Content not found in Your Library.', 3);
                        }
                    };
                })(title, type));
                
                // Set richMetadata for TV show item
                tvShowItem.richMetadata = {
                    channel: "Channel Name",
                };
            });
        }
    }
};

exports.listEpisodes = function (page, showId, seasonNumber) {
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var episodesUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "?api_key=" + apiKey;
    var episodesResponse = http.request(episodesUrl);
    var episodesJson = JSON.parse(episodesResponse);
    
    if (episodesJson.episodes && episodesJson.episodes.length > 0) {
        var showDetailsUrl = "https://api.themoviedb.org/3/tv/" + showId + "?api_key=" + apiKey;
        var showDetailsResponse = http.request(showDetailsUrl);
        var showDetailsJson = JSON.parse(showDetailsResponse);
        var showTitle = showDetailsJson.name ? showDetailsJson.name : "Unknown Show";
        
        // Set the background image for the page using the backdrop path
        if (showDetailsJson.backdrop_path) {
            page.metadata.background = "https://image.tmdb.org/t/p/original" + showDetailsJson.backdrop_path;
        }

        episodesJson.episodes.forEach(function (episode) {
            var episodeTitle = episode.name;
            var episodeNumber = episode.episode_number < 10 ? "0" + episode.episode_number : episode.episode_number;
            var cleanedSeasonNumber = seasonNumber < 10 ? "0" + seasonNumber : seasonNumber;
            var title = showTitle + " S" + cleanedSeasonNumber + "E" + episodeNumber;
            var posterPath = episode.still_path ? "https://image.tmdb.org/t/p/w500" + episode.still_path : Plugin.path + "images/scrnshtntfnd.png";
            var episodeDetailsUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "/episode/" + episode.episode_number + "?api_key=" + apiKey + "&append_to_response=external_ids";
            var episodeDetailsResponse = http.request(episodeDetailsUrl);
            var episodeDetails = JSON.parse(episodeDetailsResponse);
            var imdbid = episodeDetails.external_ids ? episodeDetails.external_ids.imdb_id : '';
            var description = episodeDetails.overview || "No description available"; // Fetching description

            // Clean up the show title for the query
            var cleanedShowTitle = encodeURIComponent(showTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase());
            var episodeUrl;

            if (service.autoPlay) {
                episodeUrl = plugin.id + ":play:" + encodeURIComponent(title) + ":" + imdbid + ":episode";
            } else {
                episodeUrl = plugin.id + ":details:" + encodeURIComponent(title) + ":" + imdbid + ":episode";
            }

            // Append item with description and cloned icon as backdrop
            var item = page.appendItem(episodeUrl, "video", {
                title: episodeNumber + "). " + episodeTitle,
                icon: posterPath,
                description: description, // Adding episode description
                backdrops: [{url: posterPath}] // Cloning the icon as backdrop
            });
        });
    } else {
        page.error("No episodes found for this season");
    }
};

exports.listSeasons = function (page, title) {
    // Fetch the show's cover art and IMDb ID
    var showCoverArtData = tmdb.fetchCoverArtAndIMDbID(title, 'show', {}, null);

    // Set the background image for the page using the cover art from the global function
    if (showCoverArtData.coverArt) {
        page.metadata.background = showCoverArtData.backdrop;
    }

    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var searchUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(title);
    var searchResponse = http.request(searchUrl);
    var searchJson = JSON.parse(searchResponse);
    
    if (searchJson.results && searchJson.results.length > 0) {
        var show = searchJson.results[0];
        var showId = show.id;

        var seasonsUrl = "https://api.themoviedb.org/3/tv/" + showId + "?api_key=" + apiKey;
        var seasonsResponse = http.request(seasonsUrl);
        var seasonsJson = JSON.parse(seasonsResponse);
        
        if (seasonsJson.seasons && seasonsJson.seasons.length > 0) {
            seasonsJson.seasons.forEach(function (season) {
                var seasonTitle = season.name;
                var seasonNumber = season.season_number;

                // Fetch cover art for the season using the global function
                var seasonCoverArtData = tmdb.fetchCoverArtAndIMDbID(title, 'show', {}, seasonNumber);

                // Use the season's cover art for the icon
                var seasonPoster = seasonCoverArtData.seasonArt || Plugin.path + "images/cvrntfnd.png";

                page.appendItem(plugin.id + ":episodes:" + showId + ":" + seasonNumber, "video", {
                    title: seasonTitle,
                    icon: seasonPoster,
                });
            });
        } else {
            page.error("No seasons found for this show");
        }
    } else {
        page.error("No TV show found with the title: " + title);
    }
};

exports.listDetails = function (page, title, imdbid, type) {
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var basePosterUrl = "https://image.tmdb.org/t/p/w500/";
    var baseBackdropUrl = "https://image.tmdb.org/t/p/original/";
    var description = "No description available";
    var posterUrl = Plugin.path + "images/default.png"; // Fallback image
    var background = Plugin.path + "images/default_backdrop.png"; // Fallback background

    // Fetch details for both movies and episodes using IMDb ID
    if (type === 'movie' || type === 'episode') {
        var apiUrl = "https://api.themoviedb.org/3/find/" + imdbid + "?api_key=" + apiKey + "&external_source=imdb_id";
        var response = http.request(apiUrl, {method: 'GET'});
        var data = showtime.JSONDecode(response.toString());

        if (data.movie_results && data.movie_results.length > 0) {
            var movie = data.movie_results[0];

            // Fetch basic movie information
            description = movie.overview || "No description available";
            posterUrl = movie.poster_path ? basePosterUrl + movie.poster_path : posterUrl;
            background = movie.backdrop_path ? baseBackdropUrl + movie.backdrop_path : background;

            // Set the background for the page
            page.metadata.background = background;

            // Fetch movie videos for trailer thumbnails
            var videosApiUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "/videos?api_key=" + apiKey;
            var videoResponse = http.request(videosApiUrl, {method: 'GET'});
            var videoData = showtime.JSONDecode(videoResponse.toString());

            var videoThumbnail = background; // Fallback to backdrop if no video thumbnail
            if (videoData.results && videoData.results.length > 0) {
                // Assuming the first video is the main trailer (usually it is)
                var video = videoData.results[0];

                if (video.site === "YouTube") {
                    // Construct YouTube thumbnail URL using the YouTube video key
                    var videoKey = video.key;
                    videoThumbnail = "https://img.youtube.com/vi/" + videoKey + "/maxresdefault.jpg";
                }
            }

            page.appendItem('', 'separator', {title: '         Actions:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});

            // Add the play item with the video thumbnail as the backdrop
            page.appendItem(plugin.id + ":play:" + title + ":" + imdbid + ":" + type, "video", {
                title: "Play",
                icon: Plugin.path + "images/play.png",
                description: description,
                backdrops: [{url: videoThumbnail}], // Use the video thumbnail for the backdrops
            });

            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});

            // Fetch runtime from a separate movie details endpoint
            var movieDetailsUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "?api_key=" + apiKey;
            var movieDetailsResponse = http.request(movieDetailsUrl);
            var movieDetails = showtime.JSONDecode(movieDetailsResponse.toString());

            page.appendItem('', 'video', {title: "Vote Average: " + (movie.vote_average ? parseInt(movie.vote_average + 0.5) : "N/A"),
                icon: Plugin.path + 'images/vote.png',
                description: description,
                backdrops: [{url: videoThumbnail}], // Use the video thumbnail
            });            
            
            page.appendItem('', 'video', {title: "Runtime: " + (movieDetails.runtime || "N/A") + " minutes",
                icon: Plugin.path + 'images/time.png',
                description: description,
                backdrops: [{url: videoThumbnail}], // Use the video thumbnail
            });

        } else if (data.tv_episode_results && data.tv_episode_results.length > 0) {
            // Handle episode results
            var episode = data.tv_episode_results[0];

            // Fetch the parent show for the backdrop image
            var showApiUrl = "https://api.themoviedb.org/3/tv/" + episode.show_id + "?api_key=" + apiKey;
            var showResponse = http.request(showApiUrl);
            var showData = showtime.JSONDecode(showResponse.toString());

            description = episode.overview || "No description available";
            posterUrl = episode.still_path ? basePosterUrl + episode.still_path : posterUrl;

            // Use the show backdrop path from the show data
            background = showData.backdrop_path ? baseBackdropUrl + showData.backdrop_path : background;

            // Set the background for the page using the show backdrop
            page.metadata.background = background;

            // Add the play item with the episode still as the backdrop
            page.appendItem(plugin.id + ":play:" + title + ":" + imdbid + ":" + type, "video", {
                title: "Play",
                icon: Plugin.path + "images/play.png",
                description: description,
                backdrops: [{url: episode.still_path ? baseBackdropUrl + episode.still_path : background}], // Still use the episode still for the backdrops
            });

            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});

            // Append episode information
            page.appendItem('', 'video', {title: "Air Date: " + (episode.air_date || "N/A"),
                icon: Plugin.path + 'images/airdate.png',
                description: description,
                backdrops: [{url: episode.still_path ? baseBackdropUrl + episode.still_path : background}], // Still use the episode still for the backdrops
            });
            
            page.appendItem('', 'video', {title: "Vote Average: " + (episode.vote_average ? parseInt(episode.vote_average + 0.5) : "N/A"),
                icon: Plugin.path + 'images/vote.png',
                description: description,
                backdrops: [{url: episode.still_path ? baseBackdropUrl + episode.still_path : background}], // Still use the episode still for the backdrops
            });            

            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/stars.png',
                title: "Guest Stars: " + (episode.guest_stars && episode.guest_stars.length > 0 ? episode.guest_stars[0].name : "N/A"),
                description: description,
                backdrops: [{url: episode.still_path ? baseBackdropUrl + episode.still_path : background}], // Still use the episode still for the backdrops
            });

        } else {
            // No information found; still add the play button
            page.appendItem(plugin.id + ":play:" + title + ":" + imdbid + ":" + type, "video", {
                title: "Play",
                icon: Plugin.path + "images/play.png",
                description: "No information available for this title.",
                backdrops: [{url: background}], // Fallback background
            });

            // Notify user that no information is available
            popup.notify("No information available for this title. You can still play the video.", 5);
        }
    }
};

exports.fetchCoverArtAndIMDbID = function (title, type, itemmd, seasonNumber, episodeNumber) {
    var apiUrl;
    var imdbID = '';
    var backdropUrl = ''; // Initialize a variable for the backdrop URL
    var showId = ''; // Initialize a variable to hold the fetched showId
    var seasonArt = ''; // Initialize a variable for the season artwork
    var episodeStill = ''; // Initialize a variable for episode still

    // Extract season and episode numbers from the title (e.g., S01E03) if they are not passed
    var seasonMatch = title.match(/[Ss]([0-9]{1,2})[Ee]([0-9]{1,2})/);
    seasonNumber = seasonMatch ? seasonMatch[1] : seasonNumber;
    episodeNumber = seasonMatch ? seasonMatch[2] : episodeNumber;

    // Remove episode identifiers from the title for search purposes
    title = title.replace(/\s*[Ss][0-9]{1,2}[Ee][0-9]{1,2}\s*$/, '');

    if (type === 'movie') {
        imdbID = itemmd.imdbid || '';
        if (!imdbID) {
            var movieTitleParts = title.split(' ');
            var year = movieTitleParts.pop();
            var movieTitle = movieTitleParts.join(' ');
            apiUrl = "https://api.themoviedb.org/3/search/movie?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(movieTitle);
        }

        if (imdbID) {
            var idUrl = "https://api.themoviedb.org/3/find/" + imdbID + "?api_key=a0d71cffe2d6693d462af9e4f336bc06&external_source=imdb_id";
            var idData = tmdb.fetchTMDBData(idUrl);
            if (idData && idData.movie_results && idData.movie_results.length > 0) {
                var item = idData.movie_results[0];
                backdropUrl = item.backdrop_path ? "https://image.tmdb.org/t/p/original" + item.backdrop_path : '';
                return {
                    coverArt: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png",
                    backdrop: backdropUrl
                };
            }
        }
    } else if (type === 'show' || type === 'episode') {
        var showTitle = type === 'episode' ? title.split(" S")[0] : title;
        apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(showTitle);

        var jsonResponse = tmdb.fetchTMDBData(apiUrl);
        if (jsonResponse && jsonResponse.results && jsonResponse.results.length > 0) {
            var item = jsonResponse.results[0];
            showId = item.id;

            if (seasonNumber) {
                var seasonApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                var seasonData = tmdb.fetchTMDBData(seasonApiUrl);

                if (seasonData && seasonData.poster_path) {
                    seasonArt = "https://image.tmdb.org/t/p/w500" + seasonData.poster_path;
                }

                if (episodeNumber) {
                    var episodeApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "/episode/" + episodeNumber + "?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                    var episodeData = tmdb.fetchTMDBData(episodeApiUrl);
                    if (episodeData && episodeData.still_path) {
                        episodeStill = "https://image.tmdb.org/t/p/w500" + episodeData.still_path;
                    }
                }
            }
        }

        backdropUrl = item.backdrop_path ? "https://image.tmdb.org/t/p/original" + item.backdrop_path : '';

        return {
            coverArt: episodeStill || seasonArt || (item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png"),
            backdrop: backdropUrl,
            seasonArt: seasonArt
        };
    }

    return {
        coverArt: Plugin.path + "images/cvrntfnd.png",
        backdrop: '',
        seasonArt: '',
        episodeStill: ''
    };
};

exports.popularShows = function (page) {
    var apiUrl = "https://api.themoviedb.org/3/trending/tv/week?api_key=a0d71cffe2d6693d462af9e4f336bc06";
    var trendingShows = tmdb.fetchTMDBData(apiUrl);

    if (!trendingShows || !trendingShows.results) return; // Early exit if no results

    var genres = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
    };

    var genreItems = {}; // Object to track items under each genre

    // Collect shows under their respective genres
    for (var i = 0; i < trendingShows.results.length; i++) {
        var show = trendingShows.results[i];
        if (show.genre_ids.length === 0 || !show.name) continue; // Skip unknown genres

        for (var j = 0; j < show.genre_ids.length; j++) {
            var genreId = show.genre_ids[j];
            var genreName = genres[genreId];
            if (!genreName) continue; // Skip if genre name is not found

            if (!genreItems[genreName]) {
                genreItems[genreName] = []; // Initialize array for the genre
            }
            genreItems[genreName].push(show); // Add show to the genre
        }
    }
    
    // Append items for each genre
    for (var genreName in genreItems) {
        if (genreItems.hasOwnProperty(genreName)) {
            page.appendItem('', 'separator', {title: ''});
            page.appendItem(null, 'separator', { title: "        " + genreName + "                                                                                                                                                                                                                                                               " });
            page.appendItem('', 'separator', {title: ''});
            var shows = genreItems[genreName];

            for (var k = 0; k < shows.length; k++) {
                var title = shows[k].name;
                // Use the global function to fetch cover art and IMDb ID
                var artworkData = tmdb.fetchCoverArtAndIMDbID(title, 'show', {}, null);
                var posterPath = artworkData.coverArt;

                var item = page.appendItem(plugin.id + ":season:" + encodeURIComponent(title), "video", {
                    title: title,
                    icon: posterPath
                });
                var type = 'show';
                item.addOptAction('Add \'' + decodeURIComponent(title) + '\' to Your Library', (function(title, type) {
                    return function() {
                        var list = JSON.parse(library.list);
                        if (isFavorite(title)) {
                            popup.notify('\'' + decodeURIComponent(title) + '\' is already in Your Library.', 3);
                        } else {
                            popup.notify('\'' + decodeURIComponent(title) + '\' has been added to Your Library.', 3);
                            var libraryItem = {
                                title: encodeURIComponent(title),
                                type: type
                            };
                            list.push(libraryItem);
                            library.list = JSON.stringify(list);
                        }
                    };
                })(title, type));

                // Add "Remove from Library" option
                item.addOptAction('Remove \'' + decodeURIComponent(title) + '\' from Your Library', (function(title) {
                    return function() {
                        var list = JSON.parse(library.list);
                        var decodedTitle = decodeURIComponent(title);
                        var initialLength = list.length;
                        list = list.filter(function(fav) {
                            return fav.title !== encodeURIComponent(decodedTitle);
                        });
                        if (list.length < initialLength) {
                            popup.notify('\'' + decodeURIComponent(decodedTitle) + '\' has been removed from Your Library.', 3);
                        } else {
                            popup.notify('Content not found in Your Library.', 3);
                        }
                        library.list = JSON.stringify(list);
                    };
                })(title));
            }
        }
    }
};

exports.popularMovies = function (page) {
    var apiUrl = "https://api.themoviedb.org/3/movie/popular?api_key=a0d71cffe2d6693d462af9e4f336bc06";
    var trendingMovies = tmdb.fetchTMDBData(apiUrl).results;

    var genres = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
    };

    var genreItems = {}; // Object to track items under each genre

    // Collect movies under their respective genres
    for (var i = 0; i < trendingMovies.length; i++) {
        var movie = trendingMovies[i];
        if (movie.genre_ids.length === 0 || !movie.title) continue; // Skip unknown genres

        for (var j = 0; j < movie.genre_ids.length; j++) {
            var genreId = movie.genre_ids[j];
            var genreName = genres[genreId];
            if (!genreName) continue; // Skip if genre name is not found

            if (!genreItems[genreName]) {
                genreItems[genreName] = []; // Initialize array for the genre
            }
            genreItems[genreName].push(movie); // Add movie to the genre
        }
    }

    // Append items for each genre
    for (var genreName in genreItems) {
        if (genreItems.hasOwnProperty(genreName)) {
            page.appendItem('', 'separator', {title: ''});
            page.appendItem(null, 'separator', { title: "        " + genreName + "                                                                                                                                                                                                                                                               " });
            page.appendItem('', 'separator', {title: ''});
            var movies = genreItems[genreName];

            for (var k = 0; k < movies.length; k++) {
                var movie = movies[k];
                var title = movie.title + (movie.release_date ? " (" + movie.release_date.substring(0, 4) + ")" : "");

                // Fetch IMDb ID directly from TMDB API
                var imdbApiUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                var imdbData = tmdb.fetchTMDBData(imdbApiUrl);
                var imdbid = imdbData.imdb_id; // Fetch IMDb ID
                var posterPath = movie.poster_path ? "https://image.tmdb.org/t/p/w500" + movie.poster_path : null;
                var type = 'movie'; // Always 'movie' since this is trending movies

                // Construct the correct URL depending on autoplay setting
                var movieurl = service.autoPlay 
                    ? plugin.id + ":play:" + encodeURIComponent(title) + ":" + imdbid + ":" + type
                    : plugin.id + ":details:" + encodeURIComponent(title) + ":" + imdbid + ":" + type;

                // Append movie item
                var item = page.appendItem(movieurl, "video", {
                    title: title,
                    icon: posterPath
                });

                // "Add to Library" option
                item.addOptAction('Add \'' + decodeURIComponent(title) + '\' to Your Library', (function(title, type, imdbid) {
                    return function() {
                        var list = JSON.parse(library.list);
                        if (isFavorite(title)) {
                            popup.notify('\'' + decodeURIComponent(title) + '\' is already in Your Library.', 3);
                        } else {
                            popup.notify('\'' + decodeURIComponent(title) + '\' has been added to Your Library.', 3);
                            var libraryItem = {
                                title: encodeURIComponent(title),
                                type: type,
                                imdbid: imdbid
                            };
                            list.push(libraryItem);
                            library.list = JSON.stringify(list);
                        }
                    };
                })(title, type, imdbid));

                // "Remove from Library" option
                item.addOptAction('Remove \'' + decodeURIComponent(title) + '\' from Your Library', (function(title) {
                    return function() {
                        var list = JSON.parse(library.list);
                        var decodedTitle = decodeURIComponent(title);
                        var initialLength = list.length;
                        list = list.filter(function(fav) {
                            return fav.title !== encodeURIComponent(decodedTitle);
                        });
                        if (list.length < initialLength) {
                            popup.notify('\'' + decodeURIComponent(decodedTitle) + '\' has been removed from Your Library.', 3);
                        } else {
                            popup.notify('Content not found in Your Library.', 3);
                        }
                        library.list = JSON.stringify(list);
                    };
                })(title));
            }
        }
    }
};