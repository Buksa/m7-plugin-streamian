// Stream Scout for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scout = function (page, title, imdbid) {
    cancelCurrentOperation();
    currentCancellationToken = createCancellationToken();
    var cancellationToken = currentCancellationToken;

    page.loading = true;
    page.model.contents = 'list';

    function cleanup() {
        page.loading = false;
        currentCancellationToken = null;
    }

    function checkCancellation() {
        if (cancellationToken.cancelled) {
            cleanup();
            throw 'Operation cancelled';
        }
    }

    function getScraperUrls() {
        return [
            service.addon1url,
            service.addon2url,
            service.addon3url,
            service.addon4url,
            service.addon5url,
            service.addon6url
        ];
    }

    function loadScraper(url) {
        if (!url) return null;

        var fileName = url.split('/').pop().replace('.js', '');
        var scriptText = showtime.httpReq(url).toString();
        var scraperFunction = new Function('page', 'title', scriptText + '\nreturn search' + fileName + '(page, title);');

        return { scraperFunction: scraperFunction, name: fileName };
    }

    try {
        var scrapers = getScraperUrls().map(loadScraper);
        var combinedResults = [];

        function analyzeQuality(magnetLink, codec) {
            // Skip H265 codecs, as they're unsupported
            if (service.H265Filter && /x265|h265/i.test(codec)) return null;
            // 4K / Ultra HD definitions
            if (/2160p|4k|ultrahd|webrip/i.test(magnetLink)) return "2160p";
            // 1080p / Full HD definitions
            if (/1080p|fullhd|fhd|webrip|webdl/i.test(magnetLink)) return "1080p";
            // 720p / HD definitions
            if (/720p|hd|hdtv|webrip|webdl/i.test(magnetLink)) return "720p";
            // 480p / Standard definition
            if (/480p|sd|dvd|webrip|webdl/i.test(magnetLink)) return "480p";
            // 360p / Lower quality definitions
            if (/360p|hq|ld|webrip|webdl/i.test(magnetLink)) return "360p";
        }


        scrapers.forEach(function (scraper) {
            if (scraper && scraper.scraperFunction) {
                var results = scraper.scraperFunction(page, title);
                checkCancellation();

                combinedResults = combinedResults.concat(
                    results.map(function (result) {
                        var parts = result.split(' - ');
                        var magnetLink = parts[0];
                        var codec = parts[3] || 'Unknown';
                        var analyzedQuality = analyzeQuality(magnetLink, codec);

                        return {
                            magnetLink: magnetLink,
                            quality: analyzedQuality || parts[1] || "Unknown",
                            seeders: parseInt(parts[2]) || 0,
                            source: scraper.name
                        };
                    })
                );
            }
        });

        checkCancellation();

        function selectBestResult(preferredRegex, fallbackRegex) {
            var filtered = combinedResults.filter(function (item) {
                return preferredRegex.test(item.quality) && item.seeders >= service.minPreferredSeeders;
            });

            if (filtered.length > 0) return filtered.sort(function (a, b) { return b.seeders - a.seeders; })[0];

            if (fallbackRegex) {
                filtered = combinedResults.filter(function (item) {
                    return fallbackRegex.test(item.quality) && item.seeders >= service.minPreferredSeeders;
                });

                if (filtered.length > 0) return filtered.sort(function (a, b) { return b.seeders - a.seeders; })[0];
            }

            return null;
        }

        function processResults() {
            checkCancellation();

            var preferredQualityRegex, nextLowerQualityRegex, nextHigherQualityRegex;

            switch (service.selectQuality) {
                case "UltraHD":
                    preferredQualityRegex = /2160p/i;
                    nextLowerQualityRegex = /1080p/i;
                    break;
                case "FullHD":
                    preferredQualityRegex = /1080p/i;
                    nextLowerQualityRegex = /720p/i;
                    nextHigherQualityRegex = /2160p/i;
                    break;
                case "HD":
                    preferredQualityRegex = /720p/i;
                    nextLowerQualityRegex = /480p/i;
                    nextHigherQualityRegex = /1080p/i;
                    break;
                case "SD":
                    preferredQualityRegex = /480p/i;
                    nextHigherQualityRegex = /720p/i;
                    break;
            }

            var selectedResult = selectBestResult(preferredQualityRegex, nextLowerQualityRegex) ||
                selectBestResult(nextHigherQualityRegex) ||
                combinedResults.sort(function (a, b) { return b.seeders - a.seeders; })[0];

            if (selectedResult.source === 'InternetArchive') {
                var vparams = 'videoparams:' + JSON.stringify({
                    title: title,
                    canonicalUrl: selectedResult.magnetLink,
                    no_fs_scan: true,
                    sources: [{ url: selectedResult.magnetLink }],
                    imdbid: imdbid
                });

                popup.notify(selectedResult.source + ' | Streaming at ' + selectedResult.quality + ', Direct.', 10);
                page.loading = false;
                page.redirect(vparams);
            } else if (selectedResult) {
                var vparams = 'videoparams:' + JSON.stringify({
                    title: title,
                    canonicalUrl: 'torrent://' + selectedResult.magnetLink,
                    no_fs_scan: true,
                    sources: [{ url: 'torrent:video:' + selectedResult.magnetLink }],
                    imdbid: imdbid
                });

                popup.notify(selectedResult.source + ' | Streaming at ' + selectedResult.quality + ' with ' + selectedResult.seeders + ' Seeders.', 10);
                page.loading = false;
                page.redirect(vparams);
            } else {
                return [];
            }

            cleanup();
        }

        processResults();

    } catch (e) {
        //showtime.print('Error: ' + e);
        cleanup();
    }
};