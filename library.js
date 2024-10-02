// Library Module for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.List = function (page) {
    // Initial setup for the Movies section
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Movies                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    // Check if library.list is defined and parse it
    var movieList = library.list ? JSON.parse(library.list) : [];

    // Loop through the list and add movies
    for (var i = movieList.length - 1; i >= 0; i--) {
        var itemmd = movieList[i];
        var type = itemmd.type;

        if (type === 'movie') {
            // Fetch cover art and IMDb ID
            var result = tmdb.fetchCoverArtAndIMDbID(itemmd.title, type, itemmd);
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

    // Check if library.list is defined and parse it for shows
    var showList = library.list ? JSON.parse(library.list) : [];

    // Loop through the list and add shows
    for (var i = showList.length - 1; i >= 0; i--) {
        var itemmd = showList[i];
        var type = itemmd.type;

        if (type === 'show' || type === 'episode') {
            // Fetch cover art and IMDb ID
            var result = tmdb.fetchCoverArtAndIMDbID(itemmd.title, type, itemmd);
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

    // Check if otalibrary.list is defined and parse it for channels
    var channelList = otalibrary.list ? eval(otalibrary.list) : [];
    var pos = 0;

    for (var i in channelList) {
        var itemmd = JSON.parse(channelList[i]);
        var item = page.appendItem(plugin.id + ":playchannel:" + decodeURIComponent(itemmd.link) + ':' + title + ':' + decodeURIComponent(itemmd.icon), "video", {
            icon: itemmd.icon ? decodeURIComponent(itemmd.icon) : null,
            description: 'Link: ' + decodeURIComponent(itemmd.link),
        });
        addOptionForRemovingChannelFromLibrary(page, item, decodeURIComponent(itemmd.title), pos);
        pos++;
    }
};