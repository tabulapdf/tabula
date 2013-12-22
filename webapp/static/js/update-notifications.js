$(function() {
  console.log(TABULA_VERSION);

  $.get('https://api.github.com/repos/jazzido/tabula/releases',
       function(data) {
         if (data.length < 1) return;
         // check if new version
         var i = data.map(function(d) { return d.name; }).indexOf(TABULA_VERSION);
         // if index >= 1, current release is not the newest
         if (i == 0) return;
         var new_release = data[i-1];
         if(new_release){
           $('div#update-alert a').attr('href', new_release.html_url);
           $('div#update-alert #new-version').html(new_release.name);
           $('div#update-alert').css('display', 'block');
         }
     });
  $.ajax({
    url: 'http://jazzido.github.io/tabula/notifications.jsonp', 
    dataType: "jsonp",
    jsonpCallback: 'notifications',
    success: function(data){
      if(data.length < 1) return;

      // find the first listed notification where today is between its `live_date` and `expires_date`
      // and within the `versions` list.
      // we might use this for, say, notifying users if a version urgently needs an update or something
      // 
      var notifications = $.grep(data, function(d){
        var today = new Date();
        if ( (d.expires_date && (new Date(d.expires_date) < today)) || (d.live_date && (new Date(d.live_date) > today)) ){ 
          return false;
        }
        // var split_tabula_version = TABULA_VERSION.split(".")
        // var tabula_major_version = split_tabula_version[0]
        // var tabula_minor_version = split_tabula_version[1]
        // var tabula_bugfix_version = split_tabula_version[2]

        // if(d.start_version){
        //   var split_start_version = d.start_version.split(".")
        //   var start_major_version = split_start_version[0]
        //   var start_minor_version = split_start_version[1]
        //   var start_bugfix_version = split_start_version[2]
        // }
        // if(d.end_version){
        //   var split_end_version = d.end_version.split(".")
        //   var end_major_version = split_end_version[0]
        //   var end_minor_version = split_end_version[1]
        //   var end_bugfix_version = split_end_version[2]
        // }

        // if ((d.end_version && tabula_major_version > end_major_version) || (d.start_version && tabula_major_version < start_major_version) ){
        //   console.log('failed on major')
        //   return false;
        // }
        // if ((d.end_version && tabula_minor_version > end_minor_version) || (d.start_version && tabula_minor_version < start_minor_version) ){
        //   console.log('failed on minor')
        //   return false;
        // }
        // if ((d.end_version && tabula_bugfix_version > end_bugfix_version) || 
        //     (d.start_version && tabula_bugfix_version < start_bugfix_version) ){
        //   console.log('failed on bugfix')
        //   return false;
        // }
        if( d.versions && d.versions.length > 0){
          return (d.versions.indexOf(TABULA_VERSION) > -1);
        }else{
          return true;
        }
      });

      if(notifications.length >= 1){
        console.log(notifications.length + " matching notifications:", notifications);
        var notification = notifications[0];
        $('div#custom-alert strong').html(notification.name);
        $('div#custom-alert span.custom-alert-body').html(notification.body);
        $('div#custom-alert').css('display', 'block');
      }else{
        console.log("no notifications")
      }

  
    }});
});
