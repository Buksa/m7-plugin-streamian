// Stream Scout for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scout = function (page, title, imdbid) {
    // Cancel any currently running instance
    cancelCurrentOperation();

    // Create a new cancellation token for this instance
    currentCancellationToken = createCancellationToken();
    const cancellationToken = currentCancellationToken;

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
            throw new Error('Operation cancelled');
        }
    }

    try {
        // Combine search results and check for cancellations
        var ytsResults = yts.search(page, title) || [];
        checkCancellation();
        var internetArchiveResults = internetarchive.search(page, title) || [];
        checkCancellation();
        var eztvResults = eztv.search(page, title) || [];
        checkCancellation();
        var tpbResults = tpb.search(page, title) || [];
        checkCancellation();

        // Function to filter results by seeder count
        function filterResults(results, source) {
            return results.filter(function(result) {
                checkCancellation();
                var parts = result.split(" - ");
                var seederCount = parseInt(parts[2]) || 0;
                return seederCount > 0;
            }).map(function(result) {
                checkCancellation();
                return result + " - " + source;
            });
        }

        ytsResults = filterResults(ytsResults, "Yify Movies");
        internetArchiveResults = filterResults(internetArchiveResults, "Internet Archive");
        eztvResults = filterResults(eztvResults, "EZTV");
        tpbResults = filterResults(tpbResults, "ThePirateBay");
        checkCancellation();

        var combinedResults = ytsResults.concat(tpbResults, internetArchiveResults, eztvResults);
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
                    return qualityRegex.test(item.split(" - ")[1]);
                });
                
                results.forEach(function(item) {
                    checkCancellation();
                    var seederCount = parseInt(item.split(" - ")[2]) || 0;
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
                    return item.split(" - ")[1] === "Unknown" &&
                           parseInt(item.split(" - ")[2]) >= minPreferredSeeders;
                }).forEach(function(item) {
                    var seederCount = parseInt(item.split(" - ")[2]) || 0;
                    if (seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            // Fallback to the highest seeder count if none meet the preferred seeder criteria
            if (!selectedResult) {
                combinedResults.forEach(function(item) {
                    var seederCount = parseInt(item.split(" - ")[2]) || 0;
                    if (seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            if (selectedResult) {
                var parts = selectedResult.split(" - ");
                var magnetLink = parts[0];
                var videoQuality = parts[1];
                var seederCount = parts[2];
                var source = parts[3];
                var vparams;
        
                if (source === 'Internet Archive') {
                    popup.notify("Streamian | Streaming from " + source + " direct at " + videoQuality, 10);
                    vparams = "videoparams:" + JSON.stringify({
                        title: title,
                        canonicalUrl: magnetLink,
                        no_fs_scan: true,
                        sources: [{
                            url: magnetLink
                        }],
                        imdbid: imdbid
                    });
                } else {
                    popup.notify("Streamian | Streaming from " + source + " with " + seederCount + " seeders at " + videoQuality, 10);
                    vparams = "videoparams:" + JSON.stringify({
                        title: title,
                        canonicalUrl: "torrent://" + magnetLink,
                        no_fs_scan: true,
                        sources: [{
                            url: "torrent:video:" + magnetLink
                        }],
                        imdbid: imdbid
                    });
                }
                page.loading = false;
                page.redirect(vparams);
            } else {
                var nostreamnotify = "No suitable streams found for " + title;
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
        showtime.print("Error in consultAddons: " + e.message);
        cleanup();
    }
};