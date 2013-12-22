$(function(){
  $('#uploadedfiles li button').on('click', function() {
     var a = $(this).prevUntil('a').prev();
     if (!confirm('Delete file "'+a.html()+'"?')) return;
     var pdf_id = a.attr('href').split('/')[2];
     $.post('/pdf/' + pdf_id,
            { _method: 'delete' },
            function() {
             $(a).parent().fadeOut(200,
                                   function() { $(this).remove(); });
         });
  });
});