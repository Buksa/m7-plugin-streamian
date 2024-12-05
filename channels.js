// Channel Scraper for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scrape = function (page) {

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
    
        page.appendItem('m3u:https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2Fsamsung_uk.m3u:Samsung TV Plus', 'video', { icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRoCZ8qaWdvSKWo5MoYQM10z02ta6IO_-U9_JT2cBVxBaIps5m', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2Fsamsung_uk.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
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
    
        page.appendItem("m3u:https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2FMyCamTV.m3u:MyCamTV (18+)", 'video', { 
            icon: 'https://adultiptv.net/wp-content/uploads/2024/04/mycamtv.jpg', 
        });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2FMyCamTV.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
        
    }
};

exports.Search = function (page, query) {

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
}

