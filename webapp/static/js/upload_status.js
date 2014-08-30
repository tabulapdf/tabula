function statusComplete(file_id) {
    if (!!window.spinobj) {
        window.spinobj.stop()
    };
    if (!!file_id) {
        window.location = '/pdf/' + file_id;
    } else {
        window.location = '/pdf/<%= file_id %>';
    }
}

function checkStatus() {
    $.ajax({
        dataType: 'json',
        url: '/queue/<%= upload_id %>/json?file_id=<%= file_id %>',
        success: function(data, status, xhr) {
            processStatus(data);
            if (data.status == "error") {
                window.location.reload(true);
            } else if (data.pct_complete >= 100) {
                statusComplete(data.file_id);
            } else {
                setTimeout(checkStatus, 1000);
            }
        },
        error: function(xhr, status, err) {
            console.log(err);
        }
    });
}
function processStatus(data) {
    var msg = ""
    if (data.message) {
        msg += ": ";
        msg += data.message;
    } else if (data.pct_complete === 0) {
        msg += ": waiting to be processed..."
    }
     console.log(data);
    $("#message").text(msg);
    $(".progress .bar").css("width", data.pct_complete + "%");
    $("#percent").html(data.pct_complete + "%");
}


$(function() {
    if(false) // already loaded{
        statusComplete();
    }else{
        window.spinpots = {
            lines: 11,
            length: 5,
            width: 2,
            radius: 4,
            hwaccel: true,
            top: '0',
            left: 0
        };
        window.spintarget = document.getElementById('spinner');
        window.spinobj = new Spinner(window.spinpots).spin(window.spintarget);
        checkStatus();
    }
});
