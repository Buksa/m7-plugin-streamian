// ThePirateBay Scraper for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.search = function (page, title) {
    page.loading = true;
    var relevantTitlePartMatch = title.match(/^(.*?)(?:\sS\d{2}E\d{2}|\s\d{4})/i);
    var relevantTitlePart = relevantTitlePartMatch ? relevantTitlePartMatch[1].trim().toLowerCase().replace(/\./g, ' ').replace(/[\-:]/g, '') : "";

    var searchUrl = "https://tpb.party/search/" + encodeURIComponent(title) + "/1/99/0";
    var results = [];

    try {
        var httpResponse = http.request(searchUrl);
        var searchPage = html.parse(httpResponse);
        
        var torrentTable = searchPage.root.getElementByTagName('tbody')[0];

        if (!torrentTable) {
            console.log("Torrent table not found.");
            page.loading = false;
            return [];
        }

        var torrents = torrentTable.getElementByTagName('tr');
        console.log("Number of torrents found: " + torrents.length);

        // Limit to 10 torrents processed
        for (var i = 0; i < Math.min(torrents.length, 10); i++) {
            var torrent = torrents[i];
            
            try {
                var titleElement = torrent.getElementByTagName('a')[2];

                if (!titleElement) continue;
                console.log("Found title Element: " + titleElement.textContent);

                // Use a regex to find the magnet link
                var magnetLinkElement = torrent.getElementByTagName('a')[3];

                var magnetLink = magnetLinkElement.attributes.getNamedItem('href').value;
                console.log("Found Magnet: " + magnetLink);

                var seederElement = torrent.getElementByTagName('td')[2];
                var seederCount = seederElement.textContent.trim();
                    
                // Determine quality based on title
                var quality = "Unknown";
                if (/1080p/i.test(titleElement.textContent)) {
                    quality = "1080p";
                } else if (/720p/i.test(titleElement.textContent)) {
                    quality = "720p";
                } else if (/XviD/i.test(titleElement.textContent)) {
                    quality = "480p";
                }

                var item = magnetLink + " - " + quality + " - " + seederCount;
                results.push(item);

            } catch (error) {
                console.log("Error processing torrent: " + error.message);
            }
        }
        page.loading = false;
        return results;
    } catch (err) {
        console.log("Error: " + err.message);
        page.loading = false;
        return [];
    }
};