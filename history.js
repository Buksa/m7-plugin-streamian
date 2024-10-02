// History Module for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.List = function (page) {
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: 'On-Demand'});
    page.appendItem('', 'separator', {title: ''});
    page.appendItem(plugin.id + ":watchhistory", "video", {
        icon: Plugin.path + "images/refresh.png"
    });
    var list = JSON.parse(ondemandhistory.list || '[]'); // Initialize list if not already present
    var pos = 0;

    // Loop through the list and add On-Demand items
    for (var i = list.length - 1; i >= 0; i--) {
        var itemmd = list[i];
        var result = tmdb.fetchCoverArtAndIMDbID(itemmd.title, itemmd.type, itemmd);
        var coverArt = result.coverArt;
        var imdbid = result.imdbID || itemmd.imdbid; // Fallback to existing IMDb ID if not found

        if (itemmd.type === 'episode') {
            var episodeurl = service.autoPlay ? 
                plugin.id + ":play:" + decodeURIComponent(itemmd.title) + ":" + imdbid + ":episode" : 
                plugin.id + ":details:" + decodeURIComponent(itemmd.title) + ":" + imdbid + ":episode";

            var item = page.appendItem(episodeurl, "video", {
                title: decodeURIComponent(itemmd.title),
                icon: coverArt,
            });
        } else if (itemmd.type === 'movie') {
            var decodedTitle = decodeURIComponent(itemmd.title);
            var titleParts = decodedTitle.split(' ');
            var year = titleParts.pop(); // Remove the year from the title
            var movieTitle = titleParts.join(' ');

            var movieurl = service.autoPlay ? 
                plugin.id + ":play:" + decodeURIComponent(itemmd.title) + ":" + imdbid + ":movie" : 
                plugin.id + ":details:" + decodeURIComponent(itemmd.title) + ":" + imdbid + ":movie";

            var item = page.appendItem(movieurl, "video", {
                title: movieTitle + " (" + year + ")", // Display the title with the year in brackets
                icon: coverArt,
            });
        } else if (itemmd.type === 'show') {
            var item = page.appendItem(plugin.id + ":season:" + itemmd.title, "video", {
                title: decodeURIComponent(itemmd.title),
                icon: coverArt,
            });
        }
        pos++;
    }

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: 'Channels'});
    page.appendItem('', 'separator', {title: ''});

    var list = eval(channelhistory.list);
    for (var i in list) {
      var itemmd = JSON.parse(list[i]);
      var item = page.appendItem(plugin.id + ":playchannel:" + itemmd.link + ':' + itemmd.title + ':' + itemmd.icon, "video", {
        //title: decodeURIComponent(itemmd.title),
        icon: "https:" + itemmd.icon,
        description: 'Link: ' + itemmd.link,
      });
    }

};