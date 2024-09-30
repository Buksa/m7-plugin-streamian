                                                                        /*| Streamian for Movian/M7 Media Center | 2024 F0R3V3R50F7 |*/

/*|---------------------------------------------------------------------------------------- Pre - Requisits ----------------------------------------------------------------------------------------|*/


var page = require('movian/page');
var service = require('movian/service');
var settings = require('movian/settings');
var http = require('movian/http');
var html = require('movian/html');
var string = require('native/string');
var popup = require('native/popup');
var store = require('movian/store');
var plugin = JSON.parse(Plugin.manifest);
var logo = Plugin.path + plugin.icon;
var yts = require('scrapers/ytsaddon');
var eztv = require('scrapers/eztvaddon');
var tpb = require('scrapers/tpbaddon');
var internetarchive = require('scrapers/internetarchiveaddon');
var modules = require('modules');
var library = store.create('library');
var channelhistory = store.create('channelhistory');
var ondemandhistory = store.create('ondemandhistory');
var otalibrary = store.create('otalibrary');
var currentCancellationToken = null;


/*|---------------------------------------------------------------------------------------- Establish Services ----------------------------------------------------------------------------------------|*/


if (!library.list) {library.list = JSON.stringify([]);}
if (!otalibrary.list) {otalibrary.list = '[]';}
if (!ondemandhistory.list) {ondemandhistory.list = '[]';}
if (!channelhistory.list) {channelhistory.list = '[]';}
service.create(plugin.title, plugin.id + ":start", 'video', true, logo);
settings.globalSettings(plugin.id, plugin.title, logo, plugin.synopsis);

settings.createDivider('                On-Demand Settings                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');
settings.createBool('h265filter', 'Enable H.265 Filter (Playstation 3)', false, function(v) {
    service.H265Filter = v;
});
settings.createBool('autoPlay', 'Enable Auto-Play', false, function(v) {
    service.autoPlay = v;
});
settings.createMultiOpt('selectQuality', 'Preferred Quality', [
    ['UltraHD', 'Ultra HD | 4k'],
    ['FullHD', 'Full HD | 1080p', true],
    ['HD', 'HD | 720p'],
    ['SD', 'SD | 480p'],
  ], function(v) {
  service.selectQuality = v;
});
settings.createMultiOpt('selectSeeders', 'Preferred Minimum Seeder Count', [
    ['100', '100'],
    ['65', '65'],
    ['40', '40'],
    ['30', '30', true],
    ['20', '20'],
    ['10', '10'],
    ['5', '5'],
    ['1', '1'],
  ], function(v) {
    service.minPreferredSeeders = v;
});
settings.createDivider('                Data Management                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');

settings.createAction('emptyhistory', 'Empty Watch History', function() {
    channelhistory.list = '[]';
    ondemandhistory.list = '[]';
    popup.notify('Watch history has been emptied successfully.', 3);
});

settings.createDivider('                Channel Settings                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');
settings.createBool('adultContent', 'Display Adult Content (18+)', false, function(v) {
    service.adultContent = v;
});


/*|---------------------------------------------------------------------------------------- Establish Global Functions ----------------------------------------------------------------------------------------|*/


function createCancellationToken() {
    return { cancelled: false };
}

// Function to cancel the current operation
function cancelCurrentOperation() {
    if (currentCancellationToken) {
        currentCancellationToken.cancelled = true;
    }
}

function addItemToHistory(title, type, imdbid, icon, link) {
    var list = JSON.parse(ondemandhistory.list);
    var historyItem = {
        title: encodeURIComponent(title),
        type: type,
        imdbid: imdbid,
        icon: icon,
        link: link
    };
    list.push(historyItem);
    ondemandhistory.list = JSON.stringify(list);
}

function addChannelToHistory(page, link, title, icon) {
    var entry = JSON.stringify({
        link: link,
        title: title,
        icon: icon
    });
    channelhistory.list = JSON.stringify([entry].concat(eval(channelhistory.list)));
}

function addOptionForAddingChannelToLibrary(item, link, title, icon) {
    item.addOptAction('Add \'' + title + '\' to Your Library', function() {
      var entry = JSON.stringify({
        link: encodeURIComponent(link),
        title: encodeURIComponent(title),
        icon: icon,
      });
      otalibrary.list = JSON.stringify([entry].concat(eval(otalibrary.list)));
      popup.notify('\'' + title + '\' has been added to Your Library.', 3);
    });
}
  
function addOptionForRemovingChannelFromLibrary(page, item, title, pos) {
    item.addOptAction('Remove \'' + title + '\' from Your Library', function() {
      var list = eval(otalibrary.list);
      popup.notify('\'' + title + '\' has been removed from Your Library.', 3);
      list.splice(pos, 1);
      otalibrary.list = JSON.stringify(list);
      page.redirect(plugin.id + ':library');
    });
}

function isFavorite(title) {
    var list = JSON.parse(library.list);
    return list.some(function(fav) {
      return fav.identifier === title;
    });
}

function addToLibrary(title, type, imdbid) {
    var list = JSON.parse(library.list);
    if (isFavorite(title)) {
      popup.notify('\'' + title + '\' is already in Your Library.', 3);
    } else {
      popup.notify('\'' + title + '\' has been added to Your Library.', 3);
      var libraryItem = {
        title: encodeURIComponent(title),
        type: type,
        imdbid: imdbid
      };
      list.push(libraryItem);
      library.list = JSON.stringify(list);
    }
}

function removeFromLibrary(title) {
    var list = JSON.parse(library.list);
    if (title) {
      var decodedTitle = decodeURIComponent(title);
      var initialLength = list.length;
      list = list.filter(function(fav) {
        return fav.title !== encodeURIComponent(decodedTitle);
      });
      if (list.length < initialLength) {
        popup.notify('\'' + decodedTitle + '\' has been removed from Your Library.', 3);
      } else {
        popup.notify('Video not found in favorites.', 3);
      }
      library.list = JSON.stringify(list);
    } else {
      popup.notify('Video not found in favorites.', 3);
    }
}

function consultAddons(page, title, imdbid) {
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

            // Filter results by preferred quality first
            var preferredResults = combinedResults.filter(function(item) {
                checkCancellation();
                return preferredQualityRegex.test(item.split(" - ")[1]);
            });
            checkCancellation();

            var selectedResult;
            var bestSeeders = 0;

            function selectBestResult(results) {
                results.forEach(function(item) {
                    checkCancellation();
                    var seederCount = parseInt(item.split(" - ")[2]) || 0;
                    if (seederCount > bestSeeders) {
                        bestSeeders = seederCount;
                        selectedResult = item;
                    }
                });
            }

            // First, try to pick a source in the preferred quality range
            if (preferredResults.length > 0) {
                selectBestResult(preferredResults);
                if (bestSeeders < minPreferredSeeders) {
                    popup.notify("Streamian | No source found in preferred quality, selecting best source.", 10);
                    selectedResult = null;  // Reset to try next quality level
                }
            }

            // If no preferred quality source was selected, try the next lower quality
            if (!selectedResult && nextLowerQualityRegex) {
                var lowerQualityResults = combinedResults.filter(function(item) {
                    checkCancellation();
                    return nextLowerQualityRegex.test(item.split(" - ")[1]);
                });
                selectBestResult(lowerQualityResults);
            }

            // If lower quality also fails, try the next higher quality
            if (!selectedResult && nextHigherQualityRegex) {
                var higherQualityResults = combinedResults.filter(function(item) {
                    checkCancellation();
                    return nextHigherQualityRegex.test(item.split(" - ")[1]);
                });
                selectBestResult(higherQualityResults);
            }

            // Fallback to "Unknown" quality if no other sources match
            if (!selectedResult) {
                var unknownQualityResults = combinedResults.filter(function(item) {
                    return item.split(" - ")[1] === "Unknown";
                });
                selectBestResult(unknownQualityResults);
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
}

function setPageHeader(page, title) {
    if (page.metadata) {
        page.metadata.title = title;
        page.metadata.icon = logo;
        page.metadata.background = Plugin.path + "images/bg.png";
    }
    page.type = "directory";
    page.contents = "items";
    page.entries = 0;
    page.loading = true;
}

function getUserLocation() {
    var apiUrl = 'http://ip-api.com/json';  // API to detect user's location
    
    var response = http.request(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!!response) {
        var data = JSON.parse(response.toString());
        return data.countryCode.toLowerCase();  // Extracting the 2-letter country code (e.g., 'uk', 'us')
    } else {
        page.appendItem("", "separator", { title: "Unable to determine location | Check http://ip-api.com" });
        return null;
        page.loading = false;
    }
}

function iprotM3UParser(page, pl, specifiedGroup, limit, query) {  // by iprot -https://github.com/lprot/movian-plugin-onlinetv
    var m3uItems = [];
    var groups = [];
    var theLastList = '';
    var title = page.metadata.title + '';
    page.loading = true;

    if (theLastList !== pl) {
        page.metadata.title = 'Loading Channels, please wait...';
        var m3u = http.request(decodeURIComponent(pl), {}).toString().split('\n');
        theLastList = pl;

        var m3uTitle = '',
            m3uImage = '',
            m3uGroup = '',
            m3uRegion = '',
            m3uEpgId = '',
            m3uHeaders = '',
            m3uUA = '';

        for (var i = 0; i < m3u.length; i++) {
            page.metadata.title = 'Loading Channels, please wait...';
            var line = m3u[i].trim();
            if (line.substr(0, 7) !== '#EXTM3U' && line.indexOf(':') < 0 && line.length !== 40) continue; // skip invalid lines
            line = string.entityDecode(line.replace(/[\u200B-\u200F\u202A-\u202E]/g, ''));

            switch (line.substr(0, 7)) {
                case '#EXTM3U':
                    var match = line.match(/region=(.*)\b/);
                    if (match) {
                        m3uRegion = match[1];
                    }
                    break;
                case '#EXTINF':
                    var match = line.match(/#EXTINF:.*,(.*)/);
                    if (match) {
                        m3uTitle = match[1].trim();
                    }
                    match = line.match(/group-title="([\s\S]*?)"/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0) {
                            groups.push(m3uGroup);
                        }
                    }
                    match = line.match(/tvg-logo=["|”]([\s\S]*?)["|”]/);
                    if (match) {
                        m3uImage = match[1].trim();
                    }
                    match = line.match(/region="([\s\S]*?)"/);
                    if (match) {
                        m3uRegion = match[1];
                    }
                    if (m3uRegion) {
                        match = line.match(/description="([\s\S]*?)"/);
                        if (match) {
                            m3uEpgId = match[1];
                        }
                    }
                    break;
                case '#EXTGRP':
                    var match = line.match(/#EXTGRP:(.*)/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0) {
                            groups.push(m3uGroup);
                        }
                    }
                    break;
                case '#EXTVLC':
                    var match = line.match(/http-(user-agent=[\s\S]*)$/);
                    if (match) {
                        m3uUA = match[1];
                    }
                    break;
                default:
                    if (line[0] === '#') {
                        m3uImage = '';
                        continue; // skip unknown tags and comments
                    }
                    line = line.replace(/rtmp:\/\/\$OPT:rtmp-raw=/, '');
                    if (line.indexOf(':') === -1 && line.length === 40) {
                        line = 'acestream://' + line;
                    }
                    if (m3uImage && m3uImage.substr(0, 4) !== 'http') {
                        m3uImage = line.match(/^.+?[^\/:](?=[?\/]|$)/) + '/' + m3uImage;
                    }
                    m3uHeaders = line.match(/([\s\S]*?)\|([\s\S]*?)$/);
                    m3uHeaders ? line = m3uHeaders[1] : '';

                    var item = {
                        title: m3uTitle ? m3uTitle : line,
                        url: line,
                        group: m3uGroup,
                        logo: m3uImage,
                        region: m3uRegion,
                        epgid: m3uEpgId,
                        headers: m3uHeaders ? m3uHeaders[2] : m3uUA ? m3uUA : void(0),
                    };

                    if (specifiedGroup && item.group !== specifiedGroup) {
                        continue; // Skip items not matching specified group
                    }

                    // Check if a query is provided and matches the item title
                    if (query && item.title.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                        continue; // Skip items that don't match the query
                    }

                    m3uItems.push(item);
                    m3uTitle = '';
                    m3uImage = '';
                    m3uEpgId = '';
                    m3uHeaders = '';
            }

            // Check if limit is reached
            if (limit && m3uItems.length >= limit) {
                break;
            }
        }

        page.metadata.title = title;
    }

    return {
        items: m3uItems,
        groups: groups
    };
}

function scrapeSamsung(page, limit, query) {
    function _0x4fe3(){var _0x5df6e8=['2077281iaIJld','Starting\x20Samsung\x20TV\x20Plus\x20channel\x20fetch...','appendItem','toString','channels','411071cRBkpW','Loading\x20Channels,\x20please\x20wait...','JSONDecode','toLowerCase','127622rtwLvI','315xWJFVz','22698mlXwNW','regions','title','Region\x20not\x20found,\x20displaying\x20custom\x20icon','log','logo','35BUUqDL','User\x27s\x20detected\x20region:\x20','https://i.mjh.nz/SamsungTVPlus/.app.json','name','metadata','hasOwnProperty','227841oPHTFb','Region\x20not\x20found\x20in\x20Samsung\x20data,\x20displaying\x20custom\x20icon','push','168296XVpuhU','video','6WTHgXN','path','Detecting\x20Region,\x20please\x20wait...','Error\x20fetching\x20Samsung\x20TV\x20Plus\x20channels.','separator','Mozilla/5.0\x20(Windows\x20NT\x2010.0;\x20Win64;\x20x64)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/85.0.4183.102\x20Safari/537.36','length','330mmieCk','1254736ioiYOK','url','GET'];_0x4fe3=function(){return _0x5df6e8;};return _0x4fe3();}var _0xb19bac=_0x329c;(function(_0x288d10,_0x376c44){var _0x487359=_0x329c,_0xa18770=_0x288d10();while(!![]){try{var _0xc43ddd=parseInt(_0x487359(0xc0))/0x1+-parseInt(_0x487359(0xd7))/0x2*(parseInt(_0x487359(0xd2))/0x3)+parseInt(_0x487359(0xdf))/0x4+-parseInt(_0x487359(0xc5))/0x5*(-parseInt(_0x487359(0xc6))/0x6)+-parseInt(_0x487359(0xcc))/0x7*(-parseInt(_0x487359(0xd5))/0x8)+-parseInt(_0x487359(0xbb))/0x9+parseInt(_0x487359(0xde))/0xa*(-parseInt(_0x487359(0xc4))/0xb);if(_0xc43ddd===_0x376c44)break;else _0xa18770['push'](_0xa18770['shift']());}catch(_0x264395){_0xa18770['push'](_0xa18770['shift']());}}}(_0x4fe3,0x375c1));var APP_URL=_0xb19bac(0xce);console[_0xb19bac(0xca)](_0xb19bac(0xbc)),page[_0xb19bac(0xd0)][_0xb19bac(0xc8)]=_0xb19bac(0xd9);var userRegion=getUserLocation();if(!userRegion){console['log'](_0xb19bac(0xc9)),page[_0xb19bac(0xbd)](null,_0xb19bac(0xd6),{'icon':plugin[_0xb19bac(0xd8)]+'images/regionerror.png'});return;}console[_0xb19bac(0xca)](_0xb19bac(0xcd)+userRegion);function _0x329c(_0x83f604,_0xb87c8){var _0x4fe35b=_0x4fe3();return _0x329c=function(_0x329c22,_0x4a92dc){_0x329c22=_0x329c22-0xba;var _0xc5f316=_0x4fe35b[_0x329c22];return _0xc5f316;},_0x329c(_0x83f604,_0xb87c8);}var response=http['request'](APP_URL,{'method':_0xb19bac(0xba),'headers':{'User-Agent':_0xb19bac(0xdc),'Accept':'application/json','Connection':'keep-alive'}});if(!!response){var allChannels=showtime[_0xb19bac(0xc2)](response[_0xb19bac(0xbe)]())[_0xb19bac(0xc7)],channels={};if(allChannels[userRegion])channels=allChannels[userRegion][_0xb19bac(0xbf)];else{console[_0xb19bac(0xca)](_0xb19bac(0xd3)),page['appendItem']('','video',{'icon':plugin['path']+'images/regionerror.png'});return;}var groupedChannels={};for(var key in channels){if(channels[_0xb19bac(0xd1)](key)){var channel=channels[key],genre=channel['group'],url=channel[_0xb19bac(0xe0)];if(!url||channel['license_url'])continue;!groupedChannels[genre]&&(groupedChannels[genre]=[]),groupedChannels[genre][_0xb19bac(0xd4)]({'id':key,'name':channel[_0xb19bac(0xcf)],'logo':channel[_0xb19bac(0xcb)],'url':url});}}page[_0xb19bac(0xd0)][_0xb19bac(0xc8)]=_0xb19bac(0xc1);var globalCount=0x0;for(var genre in groupedChannels){if(groupedChannels[_0xb19bac(0xd1)](genre)){!limit&&(page[_0xb19bac(0xbd)](null,_0xb19bac(0xdb),{'title':''}),page[_0xb19bac(0xbd)](null,'separator',{'title':genre}),page['appendItem'](null,_0xb19bac(0xdb),{'title':''}));var channelsInGenre=groupedChannels[genre];for(var j=0x0;j<channelsInGenre[_0xb19bac(0xdd)];j++){if(limit&&globalCount>=limit)break;if(query&&channelsInGenre[j]['name']['toLowerCase']()['indexOf'](query[_0xb19bac(0xc3)]())===-0x1)continue;addChannel(page,channelsInGenre[j][_0xb19bac(0xe0)],channelsInGenre[j][_0xb19bac(0xcf)],channelsInGenre[j][_0xb19bac(0xcb)]),globalCount++;}if(limit&&globalCount>=limit)break;}}}else console[_0xb19bac(0xca)](_0xb19bac(0xda));
}

function scrapePluto(page, limit, query) {
    function _0x28f3(_0x4c1fea,_0x5691c4){var _0x31f997=_0x31f9();return _0x28f3=function(_0x28f38c,_0x23c0f8){_0x28f38c=_0x28f38c-0x17d;var _0x113419=_0x31f997[_0x28f38c];return _0x113419;},_0x28f3(_0x4c1fea,_0x5691c4);}var _0x348ca6=_0x28f3;function _0x31f9(){var _0x4ec5fe=['title','path','?appName=web&appVersion=unknown&clientTime=0&deviceDNT=0&deviceId=','toString','log','http://api.pluto.tv/v2/channels','urls','&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&serverSideAds=true&sid=','4285iVFKqz','random','3066EAscen','Mozilla/5.0\x20(Windows\x20NT\x2010.0;\x20Win64;\x20x64)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/85.0.4183.102\x20Safari/537.36','4826120cJUfKP','855163qjPkLr','6392995XgpQgW','application/json','separator','request','length','name','category','2nLsZmV','11TtvRjE','logo','3IjnKxP','indexOf','floor','JSONDecode','8493228UUAYUL','hasOwnProperty','colorLogoPNG','2874824RlHGWP','How\x20To\x20Use\x20Pluto\x20TV','appendItem','8hNRnJe','Samsung','GET','12989676NxVbko','url'];_0x31f9=function(){return _0x4ec5fe;};return _0x31f9();}(function(_0x360a7d,_0x36393e){var _0x289896=_0x28f3,_0x2203a8=_0x360a7d();while(!![]){try{var _0x1921df=-parseInt(_0x289896(0x18f))/0x1*(-parseInt(_0x289896(0x197))/0x2)+parseInt(_0x289896(0x19a))/0x3*(parseInt(_0x289896(0x1a1))/0x4)+-parseInt(_0x289896(0x18a))/0x5*(-parseInt(_0x289896(0x18c))/0x6)+-parseInt(_0x289896(0x190))/0x7+-parseInt(_0x289896(0x17d))/0x8*(-parseInt(_0x289896(0x19e))/0x9)+-parseInt(_0x289896(0x18e))/0xa+-parseInt(_0x289896(0x198))/0xb*(parseInt(_0x289896(0x180))/0xc);if(_0x1921df===_0x36393e)break;else _0x2203a8['push'](_0x2203a8['shift']());}catch(_0x92f7e8){_0x2203a8['push'](_0x2203a8['shift']());}}}(_0x31f9,0x747be));var CHANNELS_URL=_0x348ca6(0x187);console[_0x348ca6(0x186)]('Starting\x20channel\x20fetch...');var response=http[_0x348ca6(0x193)](CHANNELS_URL,{'method':_0x348ca6(0x17f),'headers':{'User-Agent':_0x348ca6(0x18d),'Accept':_0x348ca6(0x191),'Connection':'keep-alive'}});if(!!response){var channelsData=showtime[_0x348ca6(0x19d)](response[_0x348ca6(0x185)]()),groupedChannels={};function generateUniqueId(){var _0x11ee61=_0x348ca6,_0x491762=new Date()['getTime'](),_0x354ad1=Math[_0x11ee61(0x19c)](Math[_0x11ee61(0x18b)]()*0xf4240)[_0x11ee61(0x185)](0x10);return _0x491762[_0x11ee61(0x185)](0x10)+'-'+_0x354ad1;}var deviceId=generateUniqueId(),sid=generateUniqueId();for(var i=0x0;i<channelsData['length'];i++){var channel=channelsData[i],genre=channel[_0x348ca6(0x196)],baseUrl=channel['stitched'][_0x348ca6(0x188)][0x0]['url']['split']('?')[0x0],logo=channel[_0x348ca6(0x1a0)][_0x348ca6(0x183)],name=channel[_0x348ca6(0x195)];if(name===_0x348ca6(0x1a2))continue;if(genre===_0x348ca6(0x17e))continue;var dynamicParams=_0x348ca6(0x184)+deviceId+_0x348ca6(0x189)+sid,finalUrl=baseUrl+dynamicParams;!groupedChannels[genre]&&(groupedChannels[genre]=[]),groupedChannels[genre]['push']({'name':name,'url':finalUrl,'logo':logo});}var totalCount=0x0;page['metadata'][_0x348ca6(0x182)]='Loading\x20Channels,\x20please\x20wait...';for(var genre in groupedChannels){if(groupedChannels[_0x348ca6(0x19f)](genre)){!limit&&(page[_0x348ca6(0x1a3)](null,_0x348ca6(0x192),{'title':''}),page['appendItem'](null,_0x348ca6(0x192),{'title':genre}),page[_0x348ca6(0x1a3)](null,_0x348ca6(0x192),{'title':''}));var channels=groupedChannels[genre];for(var j=0x0;j<channels[_0x348ca6(0x194)];j++){if(limit&&totalCount>=limit)break;if(query&&channels[j]['name']['toLowerCase']()[_0x348ca6(0x19b)](query['toLowerCase']())===-0x1)continue;addChannel(page,channels[j][_0x348ca6(0x181)],channels[j][_0x348ca6(0x195)],channels[j][_0x348ca6(0x199)]),totalCount++;}if(limit&&totalCount>=limit)break;}}if(totalCount===0x0){}}else console[_0x348ca6(0x186)]('Error\x20fetching\x20channels.');
}

function addChannels(page, items, specifiedGroup, limit) {
    var num = 0; // Initialize num counter

    for (var i = 0; i < items.length; i++) {
        if (specifiedGroup && items[i].group !== specifiedGroup) {
            continue; // Skip items not matching specified group
        }

        var description = '';
        if (items[i].region && items[i].epgid) {
            description = getEpg(items[i].region, items[i].epgid);
        }

        addChannel(page, items[i].url, items[i].title, items[i].logo, description, '', '', items[i].headers);
        num++; // Increment num for each added item

        // Check if limit is reached
        if (limit && num >= limit) {
            break;
        }
    }
}

function addChannel(page, url, title, icon) {
    console.log("Adding channel with the following parameters:");
    console.log("URL: " + url);
    console.log("Title: " + title);
    console.log("Icon: " + icon);

    var linkUrl = 'hls:' + url;
    var link = 'videoparams:' + JSON.stringify({
        icon: icon ? icon : void(0),
        sources: [{
            url: linkUrl,
        }],
        no_fs_scan: true,
        no_subtitle_scan: true,
    });

    var decodedIcon = decodeURIComponent(icon || '');

    try {
        var item = page.appendItem(plugin.id + ":playchannel:" + link + ':' + title + ':' + decodedIcon, "video", {
            icon: icon ? icon : null,
        });

        addOptionForAddingChannelToLibrary(item, link, title, icon);

        console.log("Item created:", item);
    } catch (error) {
        console.log("Error appending item:", error);
    }
}


/*|---------------------------------------------------------------------------------------- Establish Pages ----------------------------------------------------------------------------------------|*/


new page.Route(plugin.id + ":channels", function(page) {
    page.model.contents = 'grid';
    setPageHeader(page, "Channels");
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    page.loading = true;
    modules.addChannels(page);
    setPageHeader(page, "Channels");
    page.loading = false;
});

new page.Route(plugin.id + ":library", function(page) {
    setPageHeader(page, "Your Library");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_on.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    modules.library(page);
    page.loading = false;
});

new page.Route(plugin.id + ":trendingshows", function(page) {
    setPageHeader(page, "Popular Shows");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    modules.trendingshows(page);
    page.loading = false;
});

new page.Route(plugin.id + ":trendingmovies", function(page) {
    setPageHeader(page, "Popular Movies");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    modules.trendingmovies(page);
    page.loading = false;
});

new page.Route(plugin.id + ":start", function(page) {
    setPageHeader(page, "Welcome");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    popup.notify('Streamian | No Streams Available? Make sure EZTVx.to, YTS.mx, TPB.party and Archive.org are unblocked.', 10);
    modules.ondemand(page);
    page.loading = false;
});

new page.Route(plugin.id + ":search", function(page, query) {
    page.model.contents = 'grid';
    setPageHeader(page, "Search for Shows, Movies & Channels!");
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_on.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":searchresults:", 'search', { title: 'Search for Shows, Movies & Channels...' });
    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":search", "video", {
        icon: Plugin.path + "images/refresh.png"
    });
    page.loading = false;
});

new page.Route(plugin.id + ":searchresults:(.*)", function(page, query) {
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_on.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });
    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":searchresults:", 'search', { title: 'Search for Shows, Movies & Channels...' });
    page.appendItem('', 'separator', { title: '', });
    page.loading = true;
    modules.search(page, query.toLowerCase());
    setPageHeader(page, "Search Results for " + query);
    page.loading = false;
});

new page.Route(plugin.id + ":season:(.*)", function(page, title) {
    setPageHeader(page, decodeURIComponent(title));
    page.model.contents = 'grid';
    cancelCurrentOperation();

    // Page background based on the show's backdrop
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var searchUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(title);
    var searchResponse = http.request(searchUrl);
    var searchJson = JSON.parse(searchResponse);
    var type = "show";

    if (searchJson.results && searchJson.results.length > 0) {
        var show = searchJson.results[0];
        // Set the background image for the page using the backdrop path
        if (show.backdrop_path) {
            page.metadata.background = "https://image.tmdb.org/t/p/original" + show.backdrop_path;
        }

        var showId = show.id;
        var seasonsUrl = "https://api.themoviedb.org/3/tv/" + showId + "?api_key=" + apiKey;
        var seasonsResponse = http.request(seasonsUrl);
        var seasonsJson = JSON.parse(seasonsResponse);
        if (seasonsJson.seasons && seasonsJson.seasons.length > 0) {
            seasonsJson.seasons.forEach(function (season) {
                var seasonTitle = season.name;
                var posterPath = season.poster_path ? "https://image.tmdb.org/t/p/w500" + season.poster_path : Plugin.path + "images/cvrntfnd.png";
                var seasonNumber = season.season_number;
                page.appendItem(plugin.id + ":episodes:" + showId + ":" + seasonNumber, "video", {
                    title: seasonTitle,
                    icon: posterPath,
                });
            });
        } else {
            page.error("No seasons found for this show");
        }
    } else {
        page.error("No TV show found with the title: " + title);
    }
    page.loading = false;
});

new page.Route(plugin.id + ":episodes:(\\d+):(\\d+)", function(page, showId, seasonNumber) {
    var headerTitle;
    if (seasonNumber === '0') {
        headerTitle = "Specials";
        page.model.contents = 'list';
    } else {
        headerTitle = "Season " + seasonNumber + " Episodes";
    }
    setPageHeader(page, headerTitle);
    cancelCurrentOperation();

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
    page.loading = false;
});

new page.Route('channelNetwork:(.*)', function(page, title) {
    setPageHeader(page, title);
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });

    if (title === 'Pluto TV') {scrapePluto(page)};
    if (title === 'Samsung TV Plus') {scrapeSamsung(page)};

    setPageHeader(page, title);

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route('m3uGroup:(.*):(.*):(.*)', function(page, pl, specifiedGroup, title) {
    setPageHeader(page, title);
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });

    var parsedData = iprotM3UParser(page, pl, specifiedGroup);
    var items = parsedData.items;

    items.forEach(function(item) {
        addChannels(page, [item], specifiedGroup); // Use addChannels to add each item
    });

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route('m3u:(.*):(.*)', function(page, pl, title) {
    setPageHeader(page, unescape(title));
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_off.png",
    });

    var parsedData = iprotM3UParser(page, pl);
    var items = parsedData.items;

    items.forEach(function(item) {
        addChannels(page, [item]); // Use addChannels to add each item
    });

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route(plugin.id + ":play:(.*):(.*):(.*)", function(page, title, imdbid, type) {
    setPageHeader(page, "Searching for best source, please wait..");
    page.model.contents = 'list';
    title = decodeURIComponent(title);
    title = title.replace(/[\[\]{}()\-:]/g, ''); // Remove brackets, dashes, and colons
    popup.notify('Streamian | Encountering issues? Please report to Reddit r/movian', 10);
    page.appendItem(plugin.id + ":details:" + title + ":" + imdbid + ":" + type, "video", {
        title: "Cancel",
        icon: Plugin.path + "images/cancel.png",
    });
    cancelCurrentOperation();
    addItemToHistory(title, type, imdbid);
    consultAddons(page, decodeURIComponent(title), imdbid);
});

new page.Route(plugin.id + ":playchannel:(.*):(.*):(.*)", function(page, link, title, decodedIcon) {
    setPageHeader(page, "Searching for best source, please wait..");
    page.model.contents = 'list';
    icon = decodedIcon;
    cancelCurrentOperation();
    console.log("Icon Link:" + icon);
    addChannelToHistory(page, link, title, icon);
    page.redirect(link);

});

new page.Route(plugin.id + ":details:(.*):(.*):(.*)", function(page, title, imdbid, type) {
    setPageHeader(page, decodeURIComponent(title));
    page.model.contents = 'list';
    cancelCurrentOperation();

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

    popup.notify("Welcome To The Information Page! If you wish to skip this page in future, you can turn on Auto-Play in Settings.", 10);

    page.loading = false;
});

new page.Route(plugin.id + ":watchhistory", function(page) {
    setPageHeader(page, "Watch History");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/ondemand_off.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_off.png",
    });
    page.appendItem(plugin.id + ":search", 'video', {
        icon: Plugin.path + "images/search_off.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/library_off.png",
    });
    page.appendItem(plugin.id + ":watchhistory", 'video', {
        icon: Plugin.path + "images/history_on.png",
    });
    modules.history(page);
    page.loading = false;
});