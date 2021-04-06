$(() => {
    // handle login
    $('#loginForm').on('submit',(e)=>{
        e.preventDefault();

        $('#authError').hide();

        let loginData = {
            username: $("#email").val(),
	        password: $('#logPassword').val()
        };
        console.log(loginData.password);
        $.ajax({
            type: "POST",
            url: "api/auth",
            data: JSON.stringify(loginData),
            contentType: "application/json",
            statusCode: {
                401: (resObj, textStatus, jqXHR) => {
                    //alert("Bad username or password!");
                    $('#authError').show();
                    $('#authError').addClass('show');
                }
            }
        })
        .fail((jqXHR) => {
            if (jqXHR.status != 401) {
                alert('Error Reported: ' + jqXHR.status + '\n' +
                    jqXHR.statusText); 
            }
        })
        .done((data)=>{
            $('#loginPanel').hide();
            $('#userMenu').show();
            $('#welcomeMsg span').html("Welcome, " + data.firstName + 
                        '&nbsp;&nbsp;<button id="logout" type="button" class="btn btn-link">Logout</button>');
            $('#welcomeMsg').show();
            $('#logout').on('click',(e)=>{
                $('#welcomeMsg').hide();
                $('#userMenu').hide();
                $('#loginPanel').show();
                window.localStorage.removeItem('token');
            });
            $('#sem-login').modal('toggle');
            window.localStorage.setItem("token", data.token);
        });

        return false;
    });

    $('#sem-login').on('hidden.bs.modal',(e)=>{
            $('#email').val('');
            $('#logPassword').val('');
    });

    $('#sem-reg').on('hidden.bs.modal', function(e)
    { 
        $('#username').val('');
        $('#name').val('');
        $('#password').val('');
        $('#confirmPass').val('');
    }) ;

    // handle submission
    $('#regForm').on('submit',(e)=>{
        e.preventDefault();
        
        // test the password and confirmed password are equal
        $('#passError').hide();
        if ($('#password').val() == $('#confirmPass').val() ){
            // passwords are equal and rest of data validated
            // save the user
            let reqData = { username: $('#username').val(), 
                            password: $('#password').val(),
                            full_name: $('#name').val()
                          };
            $.ajax({
                type: "POST",
                url: "api/user",
                data: JSON.stringify(reqData),
                contentType: "application/json",
                statusCode: {
                    201: (resObj, textStatus, jqXHR) => {
                        $('#sem-reg').modal('toggle');
                        $('#sem-login').modal('toggle');
                    },
                    409: (resObj, textStatus, jqXHR)=> {
                        $('#username').focus().select();
                        $('#dupError').show();
                        $('#dupError').addClass('show');
                    }
                }
            })
            .fail((jqXHR) => {
                if (jqXHR.status != 409) {
                    alert('Error Reported: ' + jqXHR.status + '\n' +
                        jqXHR.statusText); 
                }
            });
            
        }
        else {
            // passwords do not match display error message
            $('#password').val('');
            $('#confirmPass').val('');
            $('#passError').show();
            $('#passError').addClass('show');
        }

        return false;
    });
   
    // get Photos page
    $('#menuPhotos').on('click',(e)=>{
        let pageNo = '9720';
        let token = window.localStorage.getItem("token");
        console.log(token);
        $.ajax({
            type: "GET",
            headers: {"X-Auth": token},
            url: "api/page?pageid=" + pageNo,
            dataType: "html",
            statusCode: {
                401: (resObj, textStatus, jqXHR) => {
                    alert("Not authorized to access page.");
                },
                404: (resObj, textStatus, jqXHR)=> {
                    alert("Page not found.");
                },
            }
        })
        .fail((jqXHR) => {
            if ((jqXHR.status != 401) || jqXHR.status != 404) {
                alert('Server Error: Try again later'); 
            }
        })
        .done((data)=>{
            data = data.trim(); // remove leading and trailing whitespace
            $('#main').html(data);  // replace the content
            console.log($('#main').html());
            console.log("Page loaded.");
            // run script to load data
            loadImages();
            return false;
        });
    });
});