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
        try {
            var scriptText = showtime.httpReq(url).toString();
            var scraperFunction = new Function('page', 'title', scriptText + '\nreturn search' + fileName + '(page, title);');

            return { scraperFunction: scraperFunction, name: fileName };
        } catch (e) {
            showtime.print("Failed to load scraper " + fileName + ": " + e.message);
            return null;
        }
    }

    try {
        var scrapers = getScraperUrls().map(loadScraper);
        var combinedResults = [];
        var errors = [];

        function analyzeQuality(magnetLink, codec) {
            if (service.H265Filter && /x265|h265/i.test(codec)) return null;

            // Explicit quality definitions
            if (/2160p|4k|ultrahd/i.test(magnetLink)) return "4k";
            if (/1080p|fullhd|fhd/i.test(magnetLink)) return "1080p";
            if (/720p|hd/i.test(magnetLink)) return "720p";
            if (/480p|sd|dvd/i.test(magnetLink)) return "480p";
            if (/360p|hq|ld/i.test(magnetLink)) return "360p";

            // Contextual handling for ambiguous terms like WebRip or WebDL
            if (/webrip|webdl/i.test(magnetLink)) {
                if (/2160p|4k|ultrahd/i.test(magnetLink)) return "4k";
                if (/1080p|fullhd|fhd/i.test(magnetLink)) return "1080p";
                if (/720p|hd/i.test(magnetLink)) return "720p";
                if (/480p|sd/i.test(magnetLink)) return "480p";
                if (/360p|hq|ld/i.test(magnetLink)) return "360p";

                // Default fallback for WebRip/WebDL without explicit quality
                return "Unknown";
            }

            return null; // Return null if no match is found
        }

        scrapers.forEach(function (scraper) {
            if (scraper && scraper.scraperFunction) {
                try {
                    page.metadata.title = 'Searching ' + scraper.name + ', please wait...';

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
                } catch (e) {
                    showtime.print("Error in scraper " + scraper.name + ": " + e.message);
                }
            }
        });

        checkCancellation();

        if (combinedResults.length === 0) {
            if (errors.length > 0) {
                errors.forEach(function (err) {
                    popup.notify("Error in addon " + err.scraper + ": " + err.error, 5);
                });
            }
            page.loading = false;
            page.error("No streams available. Check the addon configurations.");
            return;
        }

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
                    preferredQualityRegex = /4k/i;
                    nextLowerQualityRegex = /1080p/i;
                    break;
                case "FullHD":
                    preferredQualityRegex = /1080p/i;
                    nextLowerQualityRegex = /720p/i;
                    nextHigherQualityRegex = /4k/i;
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

            if (selectedResult) {
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
                } else {
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
                }
            } else {
                page.loading = false;
                popup.notify("No suitable streams found.", 5);
            }

            cleanup();
        }

        processResults();

    } catch (e) {
        cleanup();
        popup.notify("Unexpected error occurred: " + e, 5);
    }
};