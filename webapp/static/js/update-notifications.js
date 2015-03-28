$(function() {

  function showNotificationModal(){
    $('#notifications-modal').modal("show");
  }

  $('#notifications-modal').on('hidden.bs.modal', function (e) {
    if( $('input#update-notifications').is(':checked')){
      localStorage.setItem("tabula-notifications", "true");
      getNotifications();
    }else{
      localStorage.setItem("tabula-notifications", "false");
    };
  });

  var notificationSetting = localStorage.getItem("tabula-notifications");
  if ( notificationSetting == "false" ){
    return;
  }else if (notificationSetting == null){
    showNotificationModal();
  }else{
    getNotifications();
  } // if it's neither "false" nor null, it's true (or something weird)
    // so we can continue.

  function getNotifications(){
    $.get('https://api.github.com/repos/jazzido/tabula/releases',
         function(data) {
           if (data.length < 1) return;
           // check if new version
           var i = data.map(function(d) { return d.name; }).indexOf(Tabula.api_version);
           // if index >= 1, current release is not the newest
           if (i == 0) return;
           var new_release = data[0];
           if(new_release){
             $('div#update-alert a').attr('href', new_release.html_url);
             $('div#update-alert #new-version').html(new_release.name);
             $('div#update-alert').css('display', 'block');
           }
       });
    $.ajax({
      url: 'http://tabula.jeremybmerrill.com/tabula/notifications.jsonp', 
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
          if( d.versions && d.versions.length > 0){
            return (d.versions.indexOf(Tabula.api_version) > -1);
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
  }
});
