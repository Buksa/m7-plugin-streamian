// Page Script Modules for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7

// | /////////////////////////////////////////////////////////////////////////////////////////////// -- Page Scripts -- \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ | \\

exports.search = function (page, query) {
    page.model.contents = 'grid';
    setPageHeader(page, query);
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

    page.appendItem("", "separator", { title: "" });
    page.appendItem("", "separator", { title: "        Channels                                                                                                                                                                                                                                                               " });
    page.appendItem("", "separator", { title: "" });

    page.metadata.title = 'Detecting Region, please wait...';

    var userCountry = getUserLocation();
    
    
    if (!userCountry) {
        page.appendItem('', 'separator', { title: 'Failed to detect location. Please try again later.' });
        return;
    }
    
    if (userCountry == "us") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u';
        var specifiedGroup = '';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8';
        var specifiedGroup = 'USA';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "gb") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        /*var pl = 'https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u';
        var specifiedGroup = 'RakutenTV UK';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });*/// ----------- Particular list is very slow parsing and causes problems with the search.
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8';
        var specifiedGroup = 'UK';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "fr") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8';
        var specifiedGroup = 'France';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "ca") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8';
        var specifiedGroup = 'Canada';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "br") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8';
        var specifiedGroup = 'Brazil';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "kr") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south_korea.m3u8';
        var specifiedGroup = 'South Korea';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "mx") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8';
        var specifiedGroup = 'Mexico';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "cl") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8';
        var specifiedGroup = 'Chile';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "de") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8';
        var specifiedGroup = 'Germany';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "ch") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8';
        var specifiedGroup = 'Switzerland';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "dk") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8';
        var specifiedGroup = 'Denmark';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "se") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8';
        var specifiedGroup = 'Sweden';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "es") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_spain.m3u8';
        var specifiedGroup = 'Spain';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "at") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8';
        var specifiedGroup = 'Austria';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "it") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_italy.m3u8';
        var specifiedGroup = 'Italy';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "in") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
         var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_india.m3u8';
        var specifiedGroup = 'India';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "no") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8';
        var specifiedGroup = 'Norway';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    }
    
};

exports.ondemand = function (page) {
    function fetchTrending(type) {
        var apiUrl = "https://api.themoviedb.org/3/trending/" + type + "/week?api_key=a0d71cffe2d6693d462af9e4f336bc06";
        try {
            var response = showtime.httpGet(apiUrl).toString();
            console.log("[DEBUG]: Trending API URL: " + apiUrl);
            console.log("[DEBUG]: Trending API Response: " + response);
            return JSON.parse(response).results;
        } catch (error) {
            console.log("[DEBUG]: Error fetching trending " + type + ": " + error);
            return [];
        }
    }
    page.appendItem(plugin.id + ":trendingshows", "video", {
        icon: Plugin.path + "images/popular_shows.png"
    });
    var trendingShows = fetchTrending('tv');
    if (trendingShows.length > 0) {
        trendingShows.slice(0, 4).forEach(function(item) { // Limit to 4 items
            var title = item.name;
            var posterPath = item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png";
            var item = page.appendItem(plugin.id + ":season:" + decodeURIComponent(title), "video", {
                title: title,
                icon: posterPath
            });
            var type = "show";
            var title = title;
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
                item.addOptAction('Remove \'' + decodeURIComponent(title) + '\' from Your Library', (function(title, type) {
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
        });
    }
    page.appendItem(plugin.id + ":trendingmovies", "video", {
        icon: Plugin.path + "images/popular_movies.png"
    });
    var trendingMovies = fetchTrending('movie');
    if (trendingMovies.length > 0) {
        trendingMovies.slice(0, 4).forEach(function(item) { // Limit to 4 items
            var title = item.title;
            var posterPath = item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png";
            var releaseDate = item.release_date ? item.release_date.substring(0, 4) : "";
            var movieDetailsUrl = "https://api.themoviedb.org/3/movie/" + item.id + "?api_key=a0d71cffe2d6693d462af9e4f336bc06" + "&append_to_response=external_ids";
            var movieDetailsResponse = http.request(movieDetailsUrl);
            var movieDetails = JSON.parse(movieDetailsResponse);
            var imdbid = movieDetails.external_ids ? movieDetails.external_ids.imdb_id : '';
            var type = "movie";
            title = title + " " + releaseDate;
            var movieurl;
            if (service.autoPlay) {
                movieurl = plugin.id + ":play:" + encodeURIComponent(title) + ":" + imdbid + ":" + type;
            } else {
                movieurl = plugin.id + ":details:" + encodeURIComponent(title) + ":" + imdbid + ":" + type;
            }
            title = item.title + " " + "(" + releaseDate + ")";
            var item = page.appendItem(movieurl, "video", {
                title: title,
                icon: posterPath
            });
            var title = title + " " + releaseDate;
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
            item.addOptAction('Remove \'' + decodeURIComponent(title) + '\' from Your Library', (function(title) {
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
            })(title));
        });
    }
    page.appendItem("", "separator", { title: "More Coming Soon!" });

    
};

exports.trendingshows = function (page) {
    var apiUrl = "https://api.themoviedb.org/3/trending/tv/week?api_key=a0d71cffe2d6693d462af9e4f336bc06";
    var response = showtime.httpGet(apiUrl).toString();
    var trendingShows = JSON.parse(response).results;

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
    for (var i = 0; i < trendingShows.length; i++) {
        var show = trendingShows[i];
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
            page.appendItem(null, 'separator', { title: genreName });
            page.appendItem('', 'separator', {title: ''});
            var shows = genreItems[genreName];

            for (var k = 0; k < shows.length; k++) {
                var title = shows[k].name;
                var posterPath = shows[k].poster_path ? "https://image.tmdb.org/t/p/w500" + shows[k].poster_path : Plugin.path + "images/cvrntfnd.png";
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

exports.trendingmovies = function (page) {
    var apiUrl = "https://api.themoviedb.org/3/movie/popular?api_key=a0d71cffe2d6693d462af9e4f336bc06";
    var response = showtime.httpGet(apiUrl).toString();
    var trendingMovies = JSON.parse(response).results;

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
            page.appendItem(null, 'separator', { title: genreName });
            page.appendItem('', 'separator', {title: ''});
            var movies = genreItems[genreName];

            for (var k = 0; k < movies.length; k++) {
                var movie = movies[k];
                var title = movie.title + (movie.release_date ? " (" + movie.release_date.substring(0, 4) + ")" : "");
                var posterPath = movie.poster_path ? "https://image.tmdb.org/t/p/w500" + movie.poster_path : Plugin.path + "images/cvrntfnd.png";
                var imdbid = ""; // Placeholder for IMDb ID
                var type = 'movie'; // Always 'movie' since this is trending movies

                // Fetch the IMDb ID using the movie details endpoint
                var detailsUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                var detailsResponse = showtime.httpGet(detailsUrl).toString();
                var movieDetails = JSON.parse(detailsResponse);
                imdbid = movieDetails.imdb_id; // Fetch the IMDb ID from movie details

                // Construct the correct URL depending on autoplay setting
                var movieurl = "";
                if (service.autoPlay) {
                    movieurl = plugin.id + ":play:" + encodeURIComponent(title) + ":" + imdbid + ":" + type;
                } else {
                    movieurl = plugin.id + ":details:" + encodeURIComponent(title) + ":" + imdbid + ":" + type;
                }

                // Append movie item
                var item = page.appendItem(movieurl, "video", {
                    title: title,
                    icon: posterPath
                });

                // "Add to Library" option
                item.addOptAction('Add \'' + decodeURIComponent(title) + '\' to Your Library', (function(title, type) {
                    return function() {
                        var list = JSON.parse(library.list);
                        if (isFavorite(title)) {
                            popup.notify('\'' + decodeURIComponent(title) + '\' is already in Your Library.', 3);
                        } else {
                            popup.notify('\'' + decodeURIComponent(title) + '\' has been added to Your Library.', 3);
                            var libraryItem = {
                                title: encodeURIComponent(title), // Use the correctly formatted title
                                type: type
                            };
                            list.push(libraryItem);
                            library.list = JSON.stringify(list);
                        }
                    };
                })(title, type));

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

exports.library = function (page) {
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Movies                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    var list = JSON.parse(library.list);
    var pos = 0;

    function fetchCoverArtAndIMDbID(title, type) {
        var apiUrl;
    
        if (type === 'movie') {
            var imdbID = ''; // Placeholder for IMDb ID
            // Attempt to fetch IMDb ID if available
            if (itemmd.imdbid) {
                imdbID = itemmd.imdbid;
            } else {
                // Extract the year if necessary for fallback search
                var movieTitleParts = title.split(' ');
                var year = movieTitleParts.pop(); // Extract the year
                var movieTitle = movieTitleParts.join(' '); // Reconstruct title without year
    
                // Search for movie using title
                apiUrl = "https://api.themoviedb.org/3/search/movie?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(movieTitle);
            }
    
            try {
                // If we have an IMDb ID, use it to get the cover art
                if (imdbID) {
                    var idUrl = "https://api.themoviedb.org/3/find/" + imdbID + "?api_key=a0d71cffe2d6693d462af9e4f336bc06&external_source=imdb_id";
                    var idResponse = showtime.httpGet(idUrl).toString();
                    var idJson = JSON.parse(idResponse);
                    if (idJson.movie_results && idJson.movie_results.length > 0) {
                        var item = idJson.movie_results[0];
                        return {
                            coverArt: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png",
                            imdbID: imdbID // Return the IMDb ID
                        };
                    }
                }
    
                // If IMDb ID wasn't used or no results were found, fall back to title search
                if (!apiUrl) {
                    apiUrl = "https://api.themoviedb.org/3/search/movie?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(title);
                }
    
                var response = showtime.httpGet(apiUrl).toString();
                var jsonResponse = JSON.parse(response);
    
                if (jsonResponse.results && jsonResponse.results.length > 0) {
                    var item = jsonResponse.results[0];
                    var imdbID = '';
    
                    // Fetch external_ids to retrieve IMDb ID for the movie
                    var idUrl = "https://api.themoviedb.org/3/movie/" + item.id + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                    var idResponse = showtime.httpGet(idUrl).toString();
                    var idJson = JSON.parse(idResponse);
                    imdbID = idJson.imdb_id ? idJson.imdb_id : ''; // Get IMDb ID
    
                    return {
                        coverArt: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png",
                        imdbID: imdbID // Returning IMDb ID as well
                    };
                }
            } catch (error) {
                console.log("[DEBUG]: Error fetching cover art and IMDb ID: " + error);
            }
        } else if (type === 'show') {
            apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(title);
        } else if (type === 'episode') {
            var showTitle = title.split(" S")[0]; // Extract the show title before the season number
            apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + encodeURIComponent(showTitle);
        }
    
        try {
            var response = showtime.httpGet(apiUrl).toString();
            var jsonResponse = JSON.parse(response);
    
            if (jsonResponse.results && jsonResponse.results.length > 0) {
                var item = jsonResponse.results[0];
                var imdbID = '';
    
                if (type === 'episode' || type === 'show') {
                    var idUrl = "https://api.themoviedb.org/3/tv/" + item.id + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                    var idResponse = showtime.httpGet(idUrl).toString();
                    var idJson = JSON.parse(idResponse);
                    imdbID = idJson.imdb_id ? idJson.imdb_id : ''; // Get IMDb ID
                } else if (type === 'movie') {
                    var idUrl = "https://api.themoviedb.org/3/movie/" + item.id + "/external_ids?api_key=a0d71cffe2d6693d462af9e4f336bc06";
                    var idResponse = showtime.httpGet(idUrl).toString();
                    var idJson = JSON.parse(idResponse);
                    imdbID = idJson.imdb_id ? idJson.imdb_id : ''; // Get IMDb ID
                }
    
                return {
                    coverArt: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png",
                    imdbID: imdbID // Returning IMDb ID as well
                };
            }
        } catch (error) {
            console.log("[DEBUG]: Error fetching cover art and IMDb ID: " + error);
        }
        
        return {
            coverArt: Plugin.path + "images/cvrntfnd.png",
            imdbID: ''
        };
    }    

    // Loop through the list and add movies
    for (var i = list.length - 1; i >= 0; i--) {
        var itemmd = list[i];
        var type = itemmd.type;

        if (type === 'movie') {
            // Fetch cover art and IMDb ID
            var result = fetchCoverArtAndIMDbID(itemmd.title, type);
            var coverArt = result.coverArt;
            var imdbid = result.imdbID || itemmd.imdbid;

            var title = decodeURIComponent(itemmd.title);
            var titleParts = title.split(' ');
            var year = titleParts.pop(); // Extract year
            var movieTitle = titleParts.join(' ');

            var movieUrl = service.autoPlay
                ? plugin.id + ":play:" + movieTitle + ' ' + year + ":" + imdbid + ":movie"
                : plugin.id + ":details:" + movieTitle + ' ' + year + ":" + imdbid + ":movie";

            var item = page.appendItem(movieUrl, "video", {
                title: title,
                icon: coverArt,
            });

            // Remove option for movies
            item.addOptAction('Remove \'' + title + '\' from Your Library', (function(title) {
                return function() {
                    var list = JSON.parse(library.list);
                    var decodedTitle = decodeURIComponent(title);
                    list = list.filter(function(fav) {
                        return fav.title !== encodeURIComponent(decodedTitle);
                    });
                    popup.notify(decodedTitle + ' has been removed from Your Library.', 3);
                    library.list = JSON.stringify(list);
                };
            })(title));
        }
    }

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Shows                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    // Loop through the list and add shows
    for (var i = list.length - 1; i >= 0; i--) {
        var itemmd = list[i];
        var type = itemmd.type;

        if (type === 'show' || type === 'episode') {
            // Fetch cover art and IMDb ID
            var result = fetchCoverArtAndIMDbID(itemmd.title, type);
            var coverArt = result.coverArt;
            var imdbid = result.imdbID || itemmd.imdbid;

            var title = decodeURIComponent(itemmd.title);

            if (type === 'episode') {
                // Retain "Show S01E04" format for episodes
                var episodeUrl = service.autoPlay
                    ? plugin.id + ":play:" + title + ":" + imdbid + ":episode"
                    : plugin.id + ":details:" + title + ":" + imdbid + ":episode";

                var item = page.appendItem(episodeUrl, "video", {
                    title: title, // Keep the season/episode format
                    icon: coverArt,
                });

                // Remove option for episodes
                item.addOptAction('Remove \'' + title + '\' from Your Library', (function(title) {
                    return function() {
                        var list = JSON.parse(library.list);
                        var decodedTitle = decodeURIComponent(title);
                        list = list.filter(function(fav) {
                            return fav.title !== encodeURIComponent(decodedTitle);
                        });
                        popup.notify(decodedTitle + ' has been removed from Your Library.', 3);
                        library.list = JSON.stringify(list);
                    };
                })(title));

            } else if (type === 'show') {
                // Retain the show name without season/episode info
                var showUrl = plugin.id + ":season:" + title;

                var item = page.appendItem(showUrl, "video", {
                    title: title,
                    icon: coverArt,
                });

                // Remove option for shows
                item.addOptAction('Remove \'' + title + '\' from Your Library', (function(title) {
                    return function() {
                        var list = JSON.parse(library.list);
                        var decodedTitle = decodeURIComponent(title);
                        list = list.filter(function(fav) {
                            return fav.title !== encodeURIComponent(decodedTitle);
                        });
                        popup.notify(decodedTitle + ' has been removed from Your Library.', 3);
                        library.list = JSON.stringify(list);
                    };
                })(title));
            }
        }
    }

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Channels                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

 var list = eval(otalibrary.list);
    var pos = 0;
    for (var i in list) {
      var itemmd = JSON.parse(list[i]);
      var item = page.appendItem(plugin.id + ":playchannel:" + decodeURIComponent(itemmd.link) + ':' + title + ':' + decodeURIComponent(itemmd.icon), "video", {
        //title: decodeURIComponent(itemmd.title),
        icon: itemmd.icon ? decodeURIComponent(itemmd.icon) : null,
        description: 'Link: ' + decodeURIComponent(itemmd.link),
      });
      addOptionForRemovingChannelFromLibrary(page, item, decodeURIComponent(itemmd.title), pos);
      pos++;
    }
};

exports.history = function (page) {
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: 'On-Demand'});
    page.appendItem('', 'separator', {title: ''});
    page.appendItem(plugin.id + ":watchhistory", "video", {
        icon: Plugin.path + "images/refresh.png"
    });
    var list = JSON.parse(ondemandhistory.list || '[]'); // Initialize list if not already present
    var pos = 0;

    function fetchCoverArt(title, type) {
        var apiUrl;
        if (type === 'movie') {
            var movieTitleParts = title.split('%20');
            var movieTitle = movieTitleParts.slice(0, movieTitleParts.length - 1).join('%20');
            apiUrl = "https://api.themoviedb.org/3/search/movie?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + movieTitle;
        } else if (type === 'show') {
            apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + title;
        } else if (type === 'episode') {
            var showTitle = title.split("%20S")[0];
            apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=a0d71cffe2d6693d462af9e4f336bc06&query=" + showTitle;
        }
        try {
            var response = showtime.httpGet(apiUrl).toString();
            console.log("[DEBUG]: API URL: " + apiUrl);
            console.log("[DEBUG]: API Response: " + response);
            var jsonResponse = JSON.parse(response);
            if (jsonResponse.results && jsonResponse.results.length > 0) {
                var item = jsonResponse.results[0];
                return item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : Plugin.path + "images/cvrntfnd.png";
            }
        } catch (error) {
            console.log("[DEBUG]: Error fetching cover art: " + error);
        }
        return Plugin.path + "images/cvrntfnd.png";
    }
    for (var i = list.length - 1; i >= 0; i--) {
        var itemmd = list[i];

        // Skip the item if any of the required values are missing
        if (!itemmd.title || !itemmd.type || !itemmd.imdbid) {
            continue;
        }

        var coverArt;
        var type = "episode";
        if (itemmd.type === 'episode') {
            coverArt = fetchCoverArt(itemmd.title, 'episode');
            var episodeurl = service.autoPlay ? 
                plugin.id + ":play:" + decodeURIComponent(itemmd.title) + ":" + itemmd.imdbid + ":" + type : 
                plugin.id + ":details:" + decodeURIComponent(itemmd.title) + ":" + itemmd.imdbid + ":" + type;

            var item = page.appendItem(episodeurl, "video", {
                title: decodeURIComponent(itemmd.title),
                icon: coverArt,
            });
            var title = itemmd.title;
        } else if (itemmd.type === 'movie') {
            coverArt = fetchCoverArt(itemmd.title, 'movie');
            console.log("[DEBUG]: Movie Cover Art for " + itemmd.title + ": " + coverArt);
            var decodedTitle = decodeURIComponent(itemmd.title);
            var titleParts = decodedTitle.split(' ');
            var year = titleParts.pop(); // Remove the year from the title
            var movieTitle = titleParts.join(' ');
            var type = "movie";
            var movieurl = service.autoPlay ? 
                plugin.id + ":play:" + decodeURIComponent(itemmd.title) + ":" + itemmd.imdbid + ":" + type : 
                plugin.id + ":details:" + decodeURIComponent(itemmd.title) + ":" + itemmd.imdbid + ":" + type;

            var item = page.appendItem(movieurl, "video", {
                title: movieTitle + " (" + year + ")", // Display the title with the year in brackets
                icon: coverArt,
            });
            var title = movieTitle + " " + year;
        } else if (itemmd.type === 'show') {
            coverArt = fetchCoverArt(itemmd.title, 'show');
            console.log("[DEBUG]: Show Cover Art for " + decodeURIComponent(itemmd.title) + ": " + coverArt);
            var item = page.appendItem(plugin.id + ":season:" + itemmd.title, "video", {
                title: decodeURIComponent(itemmd.title),
                icon: coverArt,
            });
            var type = "show";
            var title = itemmd.title;
        }
        pos++;
    }

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: 'Channels'});
    page.appendItem('', 'separator', {title: ''});

    var list = eval(channelhistory.list);
    for (var i in list) {
      var itemmd = JSON.parse(list[i]);
      var item = page.appendItem(plugin.id + ":playchannel:" + itemmd.link + ':' + title + ':' + itemmd.icon, "video", {
        //title: decodeURIComponent(itemmd.title),
        icon: "https:" + itemmd.icon,
        description: 'Link: ' + itemmd.link,
      });
    }


};

exports.addChannels = function (page) {

    page.metadata.title = 'Detecting Region, please wait...';

    var userCountry = getUserLocation();

    if (!userCountry) {
        page.appendItem('', 'separator', { title: 'Failed to detect location. Please try again later.' });
        return;
    }
    
    if (userCountry == "us") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3u:https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u:Redbox', 'video', { icon: 'https://mma.prnewswire.com/media/858885/redbox_logo.jpg?p=facebook', });
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8:USA:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8';
        var specifiedGroup = 'USA';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    } else if (userCountry == "gb") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u:RakutenTV UK:Rakuten TV', 'video', { icon: 'https://cdn6.aptoide.com/imgs/4/0/e/40e4024425d9c9e0b311766303df3ef5_fgraphic.png', });
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u';
        var specifiedGroup = 'RakutenTV UK';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8:UK:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8';
        var specifiedGroup = 'UK';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "fr") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8:France:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8';
        var specifiedGroup = 'France';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "ca") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8:Canada:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8';
        var specifiedGroup = 'Canada';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "br") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8:Brazil:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8';
        var specifiedGroup = 'Brazil';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "kr") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south korea.m3u8:South Korea:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south_korea.m3u8';
        var specifiedGroup = 'South Korea';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "mx") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8:Mexico:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8';
        var specifiedGroup = 'Mexico';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "cl") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8:Chile:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8';
        var specifiedGroup = 'Chile';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "de") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8:Germany:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8';
        var specifiedGroup = 'Germany';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "ch") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8:Switzerland:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8';
        var specifiedGroup = 'Switzerland';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "dk") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8:Denmark:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8';
        var specifiedGroup = 'Denmark';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "se") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8:Sweden:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8';
        var specifiedGroup = 'Sweden';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "es") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_Spain.m3u8:Spain:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_spain.m3u8';
        var specifiedGroup = 'Spain';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "at") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8:Austria:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8';
        var specifiedGroup = 'Austria';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "it") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_Italy.m3u8:Italy:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_italy.m3u8';
        var specifiedGroup = 'Italy';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "in") {
    
        page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        scrapeSamsung(page, '4');
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_India.m3u8:India:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_india.m3u8';
        var specifiedGroup = 'India';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userCountry == "no") {
    
        page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://images.pluto.tv/channels/5e793a7cfbdf780007f7eb75/colorLogoPNG.png', });
        scrapePluto(page, '4');
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8:Norway:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8';
        var specifiedGroup = 'Norway';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    }

    if (service.adultContent == true) {
    
        page.appendItem("m3u:https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2FMyCamTV.m3u:MyCamTV (18+)", 'video', { icon: 'https://adultiptv.net/wp-content/uploads/2024/04/mycamtv.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2FMyCamTV.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
        
    }

};