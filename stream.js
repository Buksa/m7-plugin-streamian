// Stream Scout for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scout = function (page, title, imdbid) {
    // Cancel any currently running instance
    cancelCurrentOperation();

    // Create a new cancellation token for this instance
    currentCancellationToken = createCancellationToken();
    var cancellationToken = currentCancellationToken;

    page.loading = true;
    page.model.contents = 'list';

    // Function cleanup to reset the global variable
    function cleanup() {
        page.loading = false;
        currentCancellationToken = null;
    }

    // Check if the operation has been cancelled
    function checkCancellation() {
        if (cancellationToken.cancelled) {
            cleanup();
            throw 'Operation cancelled';
        }
    }

    // Function to get the scraper URLs from the settings dynamically
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

    // Function to dynamically load the scraper by its file URL
    function loadScraper(url) {
        if (!url) {
            console.error("Scraper URL not provided");
            return null;
        }

        // Get the filename from the URL to use as the add-on name
        var fileName = url.split('/').pop().replace('.js', '');

        // Fetch the script text from the URL
        var scriptText = showtime.httpReq(url).toString();

        // Dynamically create and return the scraper function
        var scraperFunction = new Function('page', 'title', scriptText + '\nreturn search' + fileName + '(page, title);');
        return {
            scraperFunction: scraperFunction,
            name: fileName // Use the filename as the add-on name
        };
    }

    try {
        // Dynamically load each scraper based on its file URL
        var scrapers = getScraperUrls().map(loadScraper);

        var combinedResults = [];

        // Run each scraper and collect the results
        scrapers.forEach(function(scraper) {
            if (scraper && scraper.scraperFunction) {
                var results = scraper.scraperFunction(page, title);
                checkCancellation();

                // Add the scraper name (derived from the file name) to the results
                combinedResults = combinedResults.concat(
                    results.map(function(result) {
                        return result + ' - ' + scraper.name;
                    })
                );
            }
        });

        checkCancellation();

        function processResults() {
            checkCancellation();
        
            var preferredQualityRegex;
            var nextLowerQualityRegex;
            var nextHigherQualityRegex;
        
            var minPreferredSeeders = service.minPreferredSeeders || 23;
        
            // Define quality regex patterns based on the user's selected preference
            switch (service.selectQuality) {
                case "UltraHD":
                    preferredQualityRegex = /2160p/i;
                    nextLowerQualityRegex = /1080p/i;
                    nextHigherQualityRegex = null;  // UltraHD is the highest
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
                    nextLowerQualityRegex = null;  // 480p is the lowest
                    nextHigherQualityRegex = /720p/i;
                    break;
            }
            checkCancellation();
        
            var selectedResult = null;
            var bestSeeders = 0;

            // Function to get the best source from a quality range
            function selectBestResult(qualityRegex) {
                var results = combinedResults.filter(function(item) {
                    return qualityRegex.test(item.split(' - ')[1]);
                });
                
                results.forEach(function(item) {
                    checkCancellation();
                    var seederCount = parseInt(item.split(' - ')[2]) || 0;
                    if (seederCount >= minPreferredSeeders && seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            // First, try to pick a source in the preferred quality range
            selectBestResult(preferredQualityRegex);

            // If no preferred quality source was selected, try the next lower quality
            if (!selectedResult && nextLowerQualityRegex) {
                selectBestResult(nextLowerQualityRegex);
            }

            // If no lower quality source was found or doesn't meet the seeders requirement, check the next higher quality
            if (!selectedResult && nextHigherQualityRegex) {
                selectBestResult(nextHigherQualityRegex);
            }

            // Fallback to "Unknown" quality if no other sources match
            if (!selectedResult) {
                combinedResults.filter(function(item) {
                    return item.split(' - ')[1] === 'Unknown' &&
                           parseInt(item.split(' - ')[2]) >= minPreferredSeeders;
                }).forEach(function(item) {
                    var seederCount = parseInt(item.split(' - ')[2]) || 0;
                    if (seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            // Fallback to the highest seeder count if none meet the preferred seeder criteria
            if (!selectedResult) {
                combinedResults.forEach(function(item) {
                    var seederCount = parseInt(item.split(' - ')[2]) || 0;
                    if (seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            if (selectedResult) {
                var parts = selectedResult.split(' - ');
                var magnetLink = parts[0];
                var videoQuality = parts[1];
                var seederCount = parts[2];
                var source = parts[3];
                var vparams;
        
                if (source === 'InternetArchive') {
                    popup.notify(source + ' | Streaming at ' + videoQuality + ', Direct', 10);
                    vparams = 'videoparams:' + JSON.stringify({
                        title: title,
                        canonicalUrl: magnetLink,
                        no_fs_scan: true,
                        sources: [{
                            url: magnetLink
                        }],
                        imdbid: imdbid
                    });
                } else {
                    popup.notify(source + ' | Streaming at ' + videoQuality + ' with ' + seederCount + 'Seeders.', 10);
                    vparams = 'videoparams:' + JSON.stringify({
                        title: title,
                        canonicalUrl: 'torrent://' + magnetLink,
                        no_fs_scan: true,
                        sources: [{
                            url: 'torrent:video:' + magnetLink
                        }],
                        imdbid: imdbid
                    });
                }
                page.loading = false;
                page.redirect(vparams);
            } else {
                var nostreamnotify = 'No suitable streams found for ' + title;
                setPageHeader(page, nostreamnotify);
                page.loading = false;
            }
        
            // Reset the global variable as the function execution completes
            cleanup();
        }

        // Start processing results immediately
        processResults();

    } catch (e) {
        // Log any errors and reset the global variable
        showtime.print('Error in consultAddons: ' + e);
        cleanup();
    }
};