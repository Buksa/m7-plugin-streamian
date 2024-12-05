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
var channels = require('channels');
var metadata = require('metadata');
var stream = require('stream');
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

settings.createDivider('                On-Demand Settings:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');
settings.createMultiOpt('selectQuality', 'Preferred Quality', [
    ['UltraHD', 'Ultra HD | 4k'],
    ['FullHD', 'Full HD | 1080p', true],
    ['HD', 'HD | 720p'],
    ['SD', 'SD | 480p'],
  ], function(v) {
  service.selectQuality = v;
});
settings.createBool('h265filter', 'Enable H.265 Filter (Playstation 3)', false, function(v) {
    service.H265Filter = v;
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
settings.createDivider("                Scraper Plug-in's:                                                                                                                                                                                                                                                                                                                                                                                                                              ");
settings.createDivider('');
settings.createString('addon1url', 'Slot 1', 'https://raw.githubusercontent.com/F0R3V3R50F7/m7-plugin-streamian-yifymovies/refs/heads/main/YifyMovies.js', function(v) {
    service.addon1url = v;
});
settings.createString('addon2url', 'Slot 2', 'https://raw.githubusercontent.com/F0R3V3R50F7/m7-plugin-streamian-internetarchive/refs/heads/main/InternetArchive.js', function(v) {
    service.addon2url = v;
});
settings.createString('addon3url', 'Slot 3', 'https://raw.githubusercontent.com/F0R3V3R50F7/m7-plugin-streamian-eztv/refs/heads/main/EZTV.js', function(v) {
    service.addon3url = v;
});
settings.createString('addon4url', 'Slot 4', 'https://raw.githubusercontent.com/F0R3V3R50F7/m7-plugin-streamian-thepiratebay/refs/heads/main/ThePirateBay.js', function(v) {
    service.addon4url = v;
});
settings.createString('addon5url', 'Slot 5', '', function(v) {
    service.addon5url = v;
});
settings.createString('addon6url', 'Slot 6', '', function(v) {
    service.addon6url = v;
});
settings.createDivider('                Data Management:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');

settings.createAction('emptyhistory', 'Empty Watch History', function() {
    channelhistory.list = '[]';
    ondemandhistory.list = '[]';
    popup.notify('Watch history has been emptied successfully.', 3);
});

settings.createDivider('                Channel Settings:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
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

function addtoOnDemandHistory(title, type) {
    var list = JSON.parse(ondemandhistory.list);
    var historyItem = {
      title: title,
      type: type,
    };
    list.push(historyItem);
    ondemandhistory.list = JSON.stringify(list);
}

function removeFromOnDemandHistory(title) {
    var list = ondemandhistory.list ? JSON.parse(ondemandhistory.list) : [];
    var initialLength = list.length;

    // Normalize titles by trimming spaces and converting to lowercase
    title = title.trim().toLowerCase();
    
    list = list.filter(function(fav) {
        return fav.title.trim().toLowerCase() !== title;
    });

    ondemandhistory.list = JSON.stringify(list);

    // Check if an entry was actually removed
    if (list.length < initialLength) {
        popup.notify("'" + title + "' has been removed from Your Watch History.", 3);
        page.redirect(plugin.id + ':history');
    } else {
        popup.notify("Entry not found in watch history.", 3);
    }
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

function addToLibrary(title, type, icon) {
    var list = JSON.parse(library.list);
    if (isFavorite(title)) {
      popup.notify('\'' + title + '\' is already in Your Library.', 3);
    } else {
      popup.notify('\'' + title + '\' has been added to Your Library.', 3);
      var libraryItem = {
        title: title,
        type: type,
        icon: icon
      };
      list.push(libraryItem);
      library.list = JSON.stringify(list);
    }
}

function removeFromLibrary(title) {
    var list = JSON.parse(library.list);
    var initialLength = list.length;
    list = list.filter(function(fav) {
        return fav.title !== title;
    });
    popup.notify("'" + title + "' has been removed from Your Library.", 3);
    library.list = JSON.stringify(list);
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

function recaseShowTitle(showTitle) {
    var smallWords = ['of', 'the', 'in', 'on', 'at', 'by', 'and', 'but', 'for', 'or', 'nor', 'to', 'with'];
    return showTitle.split(' ').map(function(word, index) {
        word = word.toLowerCase();
        if (index === 0 || smallWords.indexOf(word) === -1) {
            // Capitalize the first letter if it's the first word or not a small word
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word; // Return small words in lowercase
    }).join(' ');
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
    console.log("Starting Samsung TV Plus channel fetch...");
    page.metadata.title = "Detecting Region, please wait...";
    var userRegion = getUserLocation();
    if (!userRegion) {
      console.log("Region not found, displaying custom icon");
      page.appendItem(null, "video", {
        'icon': plugin.path + 'images/regionerror.png'
      });
      return;
    }
    console.log("User's detected region: " + userRegion);
    
    // Fetch the .channels.json.gz file
    var response = http.request("https://i.mjh.nz/SamsungTVPlus/.channels.json.gz", {
      'method': "GET",
      'headers': {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });
  
    if (!!response && response.length > 0) {
      console.log("Response length: " + response.length);
      
      // Convert response to a binary string (to handle the GZIP data)
      var gzipData = response.toString('binary');
      
      // Decompress GZIP to get the channels.json content
      var decompressedData = decompressGZIP(gzipData);
  
      if (decompressedData) {
        // Convert decompressed data into a UTF-8 string
        var jsonString = String.fromCharCode.apply(null, new Uint8Array(decompressedData));
        console.log("Decompressed data: " + jsonString.slice(0, 500));  // Log first 500 chars for checking

        // Parse the JSON string to get the actual channels data
        var jsonData = showtime.JSONDecode(jsonString);
        if (jsonData) {
          console.log("Parsed JSON: ", jsonData);

          var allChannels = jsonData.regions;
          var channels = {};
          if (allChannels[userRegion]) {
            channels = allChannels[userRegion].channels;
          } else {
            console.log("Region not found in the data.");
            page.appendItem('', 'video', {
              'icon': plugin.path + 'images/regionerror.png'
            });
            return;
          }

          var groupedChannels = {};
          for (var key in channels) {
            if (channels.hasOwnProperty(key)) {
              var channel = channels[key];
              var genre = channel.group;
              var url = channel.url;
              if (!url || channel.license_url) {
                continue;
              }
              if (!groupedChannels[genre]) {
                groupedChannels[genre] = [];
              }
              groupedChannels[genre].push({
                'id': key,
                'name': channel.name,
                'logo': channel.logo,
                'url': url
              });
            }
          }
  
          page.metadata.title = "Loading Channels, please wait...";
          var globalCount = 0;
          for (var genre in groupedChannels) {
            if (groupedChannels.hasOwnProperty(genre)) {
              if (!limit) {
                page.appendItem(null, "separator", {
                  'title': ''
                });
                page.appendItem(null, 'separator', {
                  'title': genre
                });
                page.appendItem(null, "separator", {
                  'title': ''
                });
              }
              var channelsInGenre = groupedChannels[genre];
              for (var j = 0; j < channelsInGenre.length; j++) {
                if (limit && globalCount >= limit) {
                  break;
                }
                if (query && channelsInGenre[j].name.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                  continue;
                }
                addChannel(page, channelsInGenre[j].url, channelsInGenre[j].name, channelsInGenre[j].logo);
                globalCount++;
              }
              if (limit && globalCount >= limit) {
                break;
              }
            }
          }
        } else {
          console.log("Failed to decode JSON.");
        }
      } else {
        console.log("Decompression failed.");
      }
    } else {
      console.log("Error fetching Samsung TV Plus channels.");
    }
}
  
// GZIP decompression function (same as before)
function decompressGZIP(gzipData) {
    // Skip the GZIP header (first 10 bytes) and footer (last 8 bytes)
    var compressedData = gzipData.slice(10, gzipData.length - 8);

    var output = [];
    var bitStream = 0;
    var bitCount = 0;
    var byte;
    
    // Simple function to read n bits from the stream
    function readBits(n) {
        while (bitCount < n) {
            byte = compressedData.shift(); // Read next byte
            bitStream |= (byte << bitCount);
            bitCount += 8;
        }
        var result = bitStream & ((1 << n) - 1);
        bitStream >>>= n;
        bitCount -= n;
        return result;
    }
    
    // Inflate the compressed data (rudimentary approach)
    while (compressedData.length > 0) {
        var code = readBits(8);  // Read 8 bits
        if (code < 256) {
            output.push(code);  // Literal byte, add to output
        } else {
            console.log("Unsupported code or incomplete implementation.");
            break;  // Stop here; full decompression requires handling lengths/distances
        }
    }

    return output;
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
    var ondemandhistoryList = ondemandhistory.list ? JSON.parse(ondemandhistory.list) : [];
    if (ondemandhistoryList.length >= 4) {
        var itemCount = 0;  // Counter to track the number of items added
        var selectedItems = [];  // Array to store selected items

        // Append the "jump back" item
        page.appendItem(plugin.id + ":watchhistory", 'video', {
            icon: Plugin.path + "images/jumpback.png",
        });

        // Select exactly 2 items from the top and 2 items from the bottom
        var topItems = ondemandhistoryList.slice(0, 2);  // Select first 2 items
        var bottomItems = ondemandhistoryList.slice(-2); // Select last 2 items

        selectedItems = topItems.concat(bottomItems);  // Combine top and bottom items

        // Process the selected items
        selectedItems.forEach(function(itemmd) {
            if (itemCount >= 4) {  // Ensure exactly 4 items are added
                return;  // Exit if the limit is reached
            }

            if (itemmd.type === 'episode') {
                var results = metadata.Scout(itemmd.title, 'episode');
                results.forEach(function(item) {
                    if (itemCount >= 4) {
                        return;  // Exit if 4 items are added
                    }
                    var itemParts = item.split(" -|- ");
                    var url = plugin.id + ":details:" + itemmd.title + ':episode';
                    var videoItem = page.appendItem(url, "video", {
                        title: itemmd.title,
                        icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                    });
                    videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Watch History', function() {
                        removeFromOnDemandHistory(itemmd.title);
                    });

                    itemCount++;  // Increment the counter
                });
            } else {
                var results = metadata.Scout(itemmd.title, 'movie');
                results.forEach(function(item) {
                    if (itemCount >= 4) {
                        return;  // Exit if 4 items are added
                    }
                    var itemParts = item.split(" -|- ");
                    var url = plugin.id + ":details:" + itemmd.title + ':movie';
                    var videoItem = page.appendItem(url, "video", {
                        title: itemmd.title,
                        icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                    });
                    videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Watch History', function() {
                        removeFromOnDemandHistory(itemmd.title);
                    });

                    itemCount++;  // Increment the counter
                });
            }
        });
    }




    page.appendItem(plugin.id + ":popularshows", "video", {
        icon: Plugin.path + "images/popular_shows.png"
    });
    var query = 'popularshows'
    var results = metadata.Scout(query.toLowerCase(), 'query');
    if (results && results.length > 0) {
        // Limit the results to 4 items
        results.slice(0, 4).forEach(function (item) {
            var itemParts = item.split(" -|- ");
            var url = plugin.id + ":show:" + itemParts[0];
            var videoItem = page.appendItem(url, "video", {
                title: itemParts[0],
                icon: itemParts[1]
            });
            videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                addToLibrary(itemParts[0], 'show', itemParts[1]);
            });
            videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                removeFromLibrary(itemParts[0]);
            });
        });
    }    
    page.appendItem(plugin.id + ":popularmovies", "video", {
        icon: Plugin.path + "images/popular_movies.png"
    });
    var query = 'popularmovies'
    var results = metadata.Scout(query.toLowerCase(), 'query');
    if (results && results.length > 0) {
        // Limit the results to 4 items
        results.slice(0, 4).forEach(function (item) {
            var itemParts = item.split(" -|- ");
            url = plugin.id + ":details:" + itemParts[0] + ':movie';
            var videoItem = page.appendItem(url, "video", {
                title: itemParts[0],
                icon: itemParts[1]
            });
            videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                addToLibrary(itemParts[0], 'movie', itemParts[1]);
            });
            videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                removeFromLibrary(itemParts[0]);
            });
        });
    }
    popup.notify('Streamian | No Streams Available? Make sure EZTVx.to, YTS.mx, TPB.party and Archive.org are unblocked.', 10);
    page.loading = false;
});

new page.Route(plugin.id + ":popularshows", function(page) {
    setPageHeader(page, "Popular Shows");
    page.model.contents = 'grid';
    cancelCurrentOperation();
    
    // Add the menu items
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

    var query = 'popularshows';
    var results = metadata.Scout(query.toLowerCase(), 'query');
    if (results && results.length > 0) {
        var genresMap = {};  // Object to group items by genre
        var uniqueTitles = {};  // Object to track unique titles

        // Group the results by genre
        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genre = decodeURIComponent(itemParts[3]);
            
            // Skip if genre is 'Unknown' or undefined
            if (genre !== 'Unknown' && genre) {
                // Check for duplicates using the title
                if (!uniqueTitles[title]) {
                    uniqueTitles[title] = true;  // Mark this title as added

                    // If the genre doesn't exist in the map, create an array for it
                    if (!genresMap[genre]) {
                        genresMap[genre] = [];
                    }

                    // Add the item to the genre array
                    genresMap[genre].push({
                        title: title,
                        icon: icon,
                        url: plugin.id + ":show:" + title
                    });
                }
            }
        });

        // Iterate through the genres and display each genre
        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                page.appendItem(plugin.id + ":genre:" + genre + ':show', "video", {
                    title: genre,
                    icon: Plugin.path + 'images/showall.png'
                });

                // Display only 4 items per genre
                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        title: item.title,
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'show', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }
    
    page.loading = false;
});

new page.Route(plugin.id + ":popularmovies", function(page) {
    setPageHeader(page, "Popular Movies");
    page.model.contents = 'grid';
    cancelCurrentOperation();

    // Add the menu items
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
    
    var query = 'popularmovies';
    var results = metadata.Scout(query.toLowerCase(), 'query');
    
    if (results && results.length > 0) {
        var genresMap = {};  // Object to group items by genre
        var uniqueTitles = {};  // Object to track unique titles

        // Group the results by genre
        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genre = decodeURIComponent(itemParts[3]);
            
            // Skip if genre is 'Unknown' or undefined
            if (genre !== 'Unknown' && genre) {
                // Check for duplicates using the title
                if (!uniqueTitles[title]) {
                    uniqueTitles[title] = true;  // Mark this title as added

                    // If the genre doesn't exist in the map, create an array for it
                    if (!genresMap[genre]) {
                        genresMap[genre] = [];
                    }

                    // Add the item to the genre array
                    genresMap[genre].push({
                        title: title,
                        icon: icon,
                        url: plugin.id + ":details:" + title + ':movie'
                    });
                }
            }
        });

        // Iterate through the genres and display each genre
        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                page.appendItem(plugin.id + ":genre:" + genre + ':movie', "video", {
                    title: genre,
                    icon: Plugin.path + 'images/showall.png'
                });
                
                // Display all 4 items for this genre
                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        title: item.title,
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'movie', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }
    
    page.loading = false;
});

new page.Route(plugin.id + ":genre:(.*):(.*)", function(page, genre, type) {
    page.model.contents = 'grid';
    setPageHeader(page, genre);
    cancelCurrentOperation();

    // Append your menu items (unchanged)
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

    // Adjust the query type based on the passed type ('show' or 'movie')
    var query = type === 'movie' ? 'popularmovies' : 'popularshows';  // Set the query based on the type

    var results = metadata.Scout(query.toLowerCase(), 'query', 30);  // Retrieve results from the API

    if (results && results.length > 0) {
        var uniqueTitles = {};  // Object to track unique titles

        // Process the results to filter by the specified genre
        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var itemGenre = decodeURIComponent(itemParts[3]);
            var type = itemParts[2];

            // Only show items that match the genre passed in the route
            if (itemGenre === genre && !uniqueTitles[title]) {
                uniqueTitles[title] = true;  // Mark this title as added

                // Append the item to the page
                var videoItem = page.appendItem(plugin.id + ":" + type + ":" + title, "video", {
                    title: title,
                    icon: icon
                });

                // Add options for adding/removing from the library
                videoItem.addOptAction('Add \'' + title + '\' to Your Library', function() {
                    addToLibrary(title, type, icon);  // Use 'type' for consistency in adding/removing
                });
                videoItem.addOptAction('Remove \'' + title + '\' from Your Library', function() {
                    removeFromLibrary(title);
                });
            }
        });
    }

    page.loading = false;
});

new page.Route(plugin.id + ":search", function(page) {
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
    setPageHeader(page, "Search Results for " + query);
    page.loading = true;
    page.model.contents = 'grid';
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
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        On-Demand                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});
    var results = metadata.Scout(query.toLowerCase(), 'query');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            if (itemParts[2] === 'movie') {
                url = plugin.id + ":details:" + itemParts[0] + ':movie';
                videoItem = page.appendItem(url, "video", {
                    title: itemParts[0],
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
                });
                videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                    addToLibrary(itemParts[0], 'movie', itemParts[1]);
                });
                videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                    removeFromLibrary(itemParts[0]);
                });
            } else {
                url = plugin.id + ":show:" + itemParts[0];
                videoItem = page.appendItem(url, "video", {
                    title: itemParts[0],
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
                });
                videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                    addToLibrary(itemParts[0], 'show', itemParts[1]);
                });
                videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                    removeFromLibrary(itemParts[0]);
                });
            }
            
        });
    }
    page.appendItem("", "separator", { title: "" });
    page.appendItem("", "separator", { title: "        Channels                                                                                                                                                                                                                                                               " });
    page.appendItem("", "separator", { title: "" });
    channels.Search(page, query.toLowerCase());
    page.loading = false;
});

new page.Route(plugin.id + ":show:(.*)", function(page, query) {
    setPageHeader(page, decodeURIComponent(query));
    page.model.contents = 'grid';
    cancelCurrentOperation();
    var results = metadata.Scout(query.toLowerCase(), 'show');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            url = plugin.id + ":season:" + query + ' S' + itemParts[3];
            page.appendItem(url, "video", {
                title: itemParts[0],
                icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
            });
        });
    }
    page.loading = false;
});

new page.Route(plugin.id + ":season:(.*)", function(page, query) {
    page.model.contents = 'list';
    cancelCurrentOperation();
    var results = metadata.Scout(query.toLowerCase(), 'season');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            url = plugin.id + ":details:" + itemParts[2] + ':episode';
            page.appendItem(url, "video", {
                title: itemParts[0],
                description: itemParts[3],
                icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
        });
    }
    // Recase the query: replace 'S' followed by a digit with 'Season' followed by the number
    var recasedQuery = query.replace(/ S(\d+)/, function(match, p1) {
        return ' Season ' + p1;
    });

    // Set the page header with the modified query
    setPageHeader(page, recasedQuery);

    page.loading = false;
});

new page.Route(plugin.id + ":details:(.*):(.*)", function(page, query, type) {
    setPageHeader(page, "Loading Information... please wait");
    page.model.contents = 'list';
    cancelCurrentOperation();
    page.appendItem('', 'separator', {title: '         Actions:                                                                                                                              '});
    page.appendItem('', 'separator', {title: ''});

    var results = metadata.Scout(query.toLowerCase(), type);
    if (type === 'episode') {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            var url =  plugin.id + ":play:" + query + ':' + itemParts[7] + ':episode';
            page.metadata.background = itemParts[0];
            page.metadata.title = itemParts[8] || query;
            page.appendItem(url, "video", {
                title: "Play",
                description: itemParts[5],
                icon: Plugin.path + "images/play.png",
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'video', {title: "Air Date: " + itemParts[2],
                icon: Plugin.path + 'images/airdate.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {title: "Vote Average: " + itemParts[3],
                icon: Plugin.path + 'images/vote.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });            
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/stars.png',
                title: "Guest Stars: " + itemParts[4],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
        });
    } else {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            var url =  plugin.id + ":play:" + query + ':' + itemParts[8] + ':movie';
            page.metadata.background = itemParts[0];
            page.metadata.title = query; 
            page.appendItem(url, "video", {
                title: "Play",
                icon: Plugin.path + "images/play.png",
                description: itemParts[5],
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'video', {title: "Release Date: " + itemParts[2],
                icon: Plugin.path + 'images/airdate.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {title: "Vote Average: " + itemParts[3],
                icon: Plugin.path + 'images/vote.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });            
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/time.png',
                title: "Runtime: " + itemParts[4],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/cast.png',
                title: "Cast: " + itemParts[6],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/crew.png',
                title: "Crew: " + itemParts[7],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
        });
    }
    popup.notify("Welcome To The Information Page! If you wish to skip this page in future, you can turn on Auto-Play in Settings.", 10);
    page.loading = false;
});

new page.Route(plugin.id + ":play:(.*):(.*):(.*)", function(page, query, imdbid, type) {
    setPageHeader(page, "Searching for best source, please wait..");
    cancelCurrentOperation();
    addtoOnDemandHistory(query, type);
    var sanitized = query;
    // Remove special characters and specific words for all types
    sanitized = sanitized.replace(/presents|[:]/gi, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
    // For movies, remove brackets around the year (if any) but keep the year
    if (type === 'movie') {
        sanitized = sanitized.replace(/\s*\(\d{4}\)\s*/g, " "); // Remove brackets around the year
    }
    // For episodes, remove the year and normalize season/episode formatting
    if (type === 'episode') {
        // Remove the year if present
        sanitized = sanitized.replace(/\b\d{4}\b/g, "").trim();

        // Normalize S1E1 to S01E01 (two digits for season and episode numbers)
        sanitized = sanitized.replace(/S(\d{1,2})E(\d{1,2})/i, function(match, season, episode) {
            return 'S' + ('0' + season).slice(-2) + 'E' + ('0' + episode).slice(-2);
        });
    }
    // Collapse multiple spaces to a single space
    query = sanitized.replace(/\s+/g, " ").trim();
    popup.notify('Streamian | Encountering issues? Please report to Reddit r/movian', 10);
    stream.Scout(page, query, imdbid);
});

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
    channels.Scrape(page);
    setPageHeader(page, "Channels");
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

new page.Route(plugin.id + ":playchannel:(.*):(.*):(.*)", function(page, link, title, decodedIcon) {
    setPageHeader(page, "Searching for best source, please wait..");
    page.model.contents = 'list';
    icon = decodedIcon;
    cancelCurrentOperation();
    console.log("Icon Link:" + icon);
    addChannelToHistory(page, link, title, icon);
    page.redirect(link);

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
    // Check if library.list is defined and parse it
    var libraryList= library.list ? JSON.parse(library.list) : [];

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        On-Demand                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    for (var i = libraryList.length - 1; i >= 0; i--) {
        itemmd = libraryList[i];
        if (itemmd.type === 'show') {
            url = plugin.id + ":show:" + itemmd.title;
            var videoItem = page.appendItem(url, "video", {
                title: itemmd.title,
                icon: itemmd.icon.indexOf('https') > -1 ? itemmd.icon : Plugin.path + "images/nostill.png",
            });
            videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Library', function() {
                removeFromLibrary(itemmd.title);
            });
        } else {
            url = plugin.id + ":details:" + itemmd.title + ':movie';
            videoItem = page.appendItem(url, "video", {
                title: itemmd.title,
                icon: itemmd.icon  || Plugin.path + "images/nostill.png"
            });
            videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Library', function() {
                removeFromLibrary(itemmd.title);
                page.redirect(plugin.id + ":library")
            });
        }

    }

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Channels                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    var channelList = otalibrary.list ? eval(otalibrary.list) : [];
    var pos = 0;

    for (var i in channelList) {
        var itemmd = JSON.parse(channelList[i]);
        var item = page.appendItem(plugin.id + ":playchannel:" + decodeURIComponent(itemmd.link) + ':' + itemmd.title + ':' + decodeURIComponent(itemmd.icon), "video", {
            icon: itemmd.icon ? decodeURIComponent(itemmd.icon) : Plugin.path + "images/nostill.png",
            description: 'Link: ' + decodeURIComponent(itemmd.link),
        });
        addOptionForRemovingChannelFromLibrary(page, item, decodeURIComponent(itemmd.title), pos);
        pos++;
    }
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

    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        On-Demand                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    var ondemandhistoryList = ondemandhistory.list ? JSON.parse(ondemandhistory.list) : [];

    for (var i = ondemandhistoryList.length - 1; i >= 0; i--) {
        var itemmd = ondemandhistoryList[i];

        if (itemmd.type === 'episode') {
            var results = metadata.Scout(itemmd.title, 'episode');
            results.forEach(function (item) {
                var itemParts = item.split(" -|- ");
                var url = plugin.id + ":details:" + itemmd.title + ':episode';
                var videoItem = page.appendItem(url, "video", {
                    title: itemmd.title,
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                });
                videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Watch History', function() {
                    removeFromOnDemandHistory(itemmd.title);
                });
            });
        } else {
            var results = metadata.Scout(itemmd.title, 'movie');
            results.forEach(function (item) {
                var itemParts = item.split(" -|- ");
                var url = plugin.id + ":details:" + itemmd.title + ':movie';
                var videoItem = page.appendItem(url, "video", {
                    title: itemmd.title,
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                });
                videoItem.addOptAction('Remove \'' + itemmd.title + '\' from Your Watch History', function() {
                    removeFromOnDemandHistory(itemmd.title);
                });
            });
        }
    }
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        Channels                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    var list = eval(channelhistory.list);
    for (var i in list) {
      var itemmd = JSON.parse(list[i]);
      var item = page.appendItem(plugin.id + ":playchannel:" + itemmd.link + ':' + itemmd.title + ':' + itemmd.icon, "video", {
        //title: decodeURIComponent(itemmd.title),
        icon: "https:" + itemmd.icon || Plugin.path + "images/nostill.png",
        description: 'Link: ' + itemmd.link,
      });
    }
    page.loading = false;
});