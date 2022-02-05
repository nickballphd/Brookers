
function get_user_data(){
    // reads the cookie to get a JSON block of user name, email, roles 
    try{
      return JSON.parse(atob(get_cookie("data")))
    }catch(e){
      return {roles:[]}
    }
}


async function login(params){
    // manage the login process

    const panel=tag("login_panel")

    if(!params){ // no parameters, just show the form

        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email" name="email"><br>
                    <input placeholder="Password" name="password" type="password"><br>
                    <input type="hidden" name="mode" value="login">
                    <button id="login_button" type="button" onclick="login(form_data(this,true))">Log In</button>
                </form>        
            `
        }else{
            toggle(panel)
        }
    }else{
        // params were sent, it must be an attempt at loggin in.

        // validate data before sending to server
        if(!params.email || !params.password){
            message({
                title:"Login Failed",
                message:"Email and password are both requied",
                kind:"error",
                seconds:5    
            })
            tag("login_button").innerHTML="Login"
            return
        }


        if(!is_valid_email(params.email)){
            message({
                title:"Login Failed",
                message:"Email is not in expected format",
                kind:"error",
                seconds:5    
            })
            tag("login_button").innerHTML="Login"
            return
        }


        const response = await post_data(params)
        if(response.status==="success"){
            build_menu(authenticated_menu)
            //show_menu(authenticated_menu)
        }else{
            message({
                title:"Login Failed",
                message:"Either the email address or password was not recognized",
                kind:"error",
                seconds:5    
            })
    
            tag("login_button").innerHTML="Login"
        }
    }
}

function is_valid_email(email){
    // returns true if true if email is in form:
    // anystring@anystring.anystring
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

async function logout(){
  erase_cookie("auth")
  erase_cookie("data")
  build_menu(unauthenticated_menu)
  show_home()
}

async function personal_data(params){
    console.log("at personal data", params)
    hide_menu()
    
    if(!params){ //no params sent.  Need to build the form container
        tag("canvas").innerHTML=` 
        <div class="center-screen">
            <div class="white-box">
                <h2>Modify Data</h2>
                <div id="personal-data-message" style="width:170px;padding-top:1rem;margin-bottom:1rem">
                <i class="fas fa-spinner fa-pulse"></i> Getting your data.
                </div>
                <div id="personal_data_panel"></div>
            </div>
        </div>
        `
        const panel=tag("personal_data_panel")
      
        response = await post_data({  // getting the member data
            mode:"get_member_data"
        })

        if(response.status==="success"){
            tag("personal-data-message").innerHTML="Update your personal data below."
            panel.style.display="block"
            console.log("response",response)
            panel.innerHTML=`
                <form>
                    <input placeholder="First Name" name="first_name" id="1235" value="${response.data.fields.first_name}"><br>
                    <input placeholder="Last Name" name="last_name" value="${response.data.fields.last_name}"><br>
                    <input placeholder="Email Address" name="email" value="${response.data.fields.email}"><br>
                    <input placeholder="Phone Number" name="phone" value="${response.data.fields.phone}"><br>
                    Other members can see ...<br>
                    <select name="visibility">
                        <option value="show-all" ${response.data.fields.visibility==="show-all" ?"selected":""}>my phone and email</option>
                        <option value="email-only" ${response.data.fields.visibility==="email-only" ?"selected":""}>my email address only</option>
                        <option value="phone-only" ${response.data.fields.visibility==="phone-only" ?"selected":""}>my phone number only</option>
                        <option value="hide-all" ${response.data.fields.visibility==="hide-all" ?"selected":""}>no contact details</option>
                    </select><br><br>
                    <input type="hidden" name="mode" value="update_member_data">
                    <button id="submit_button" type="button" onclick="personal_data(form_data(this,true))">Update</button>
                </form>   
            `    

            tag("1235").focus()
        }else{
            message({
                title:"Server Failure",
                message:"Error getting personal data: " + response.message,
                kind:"error",
                seconds:5    
            })
        }
        
    }else if(params.button){
        if(params.button==='Update'){
            response = await post_data(params)
            tag("submit_button").innerHTML="Update"

            if(response.status==="success"){
                message({
                    title:"Success",
                    message:"Data Updated",
                    seconds:3
                })
            }else{
                message({
                    title:"Server Failure",
                    message:`Failed to update. ${response.message}`,
                    kind:"error",
                    seconds:5    
                })
            }
        }
    }
}    

async function create_account(params){
    const panel=tag("create_account_panel")
    hide_menu()
    
    if(!params){ 
        tag("canvas").innerHTML=` 
        <div class="center-screen">
            <div class="white-box">
                <h2>Sign Up</h2>
                <div id="create-account-message" style="width:170px;padding-top:1rem;margin-bottom:1rem">
                Plant Simple Provo is an in-person support group.  Although we currently share our meetings over Zoom, the focus is on the in-person experience.
                </div>
                <div id="create_account_panel"></div>
            </div>
        </div>
        `
        create_account({action:"show-form"})
    }else if(params.button){
        if(params.button==='Create Account'){
            response = await post_data(params)
            console.log("response in submit_account", response)
            tag("create-account-message").innerHTML="Check your email for a code and enter it here."
            if(response.status==="success"){
                panel.innerHTML=`
                ${params.first_name}
                ${params.last_name}<br>
                ${params.email}<br>
                <form>
                <input placeholder="Code From Email" name="code"><br>
                <input type="hidden" name="mode" value="verify_account">
                <input type="hidden" name="email" value="${params.email}">
                <button type="button" onclick="create_account(form_data(this,true))">Verify Account</button>
                </form>   
            `    
                

            }else{
            tag("create-account-message").innerHTML="Account creation failed. " + response.message
            tag("create_account_button").innerHTML="Create Account"    
            }
        }else if (params.button==='Verify Account'){
            response = await post_data(params)
            if(response.status==="success"){
                message({
                    title:"Account Verified",
                    message:"You are now logged in.",
                    seconds:3
                })                
                // might make a call back to server at this point
                build_menu(authenticated_menu)
                show_home()
                
            }else{
                message({
                    title:"Confirmation Failure",
                    message:`Failed to confirm account: ${response.message}`,
                    kind:"error",
                    seconds:5    
                })                
            }
        }else{
            console.log("invalid process:", params.button)
        }

    }else if(params.action==="show-form"){    
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="First Name" name="first_name" id="1234"><br>
                    <input placeholder="Last Name" name="last_name"><br>
                    <input placeholder="Email Address" name="email"><br>
                    <input placeholder="Phone Number" name="phone"><br>
                    <input placeholder="Password" name="password" type="password"><br><br>
                    Other members can see ...<br>
                    <select name="visibility">
                        <option value="show-all" selected>my phone and email</option>
                        <option value="email-only">my email address only</option>
                        <option value="phone-only">my phone number only</option>
                        <option value="hide-all">no contact details</option>
                    </select><br><br>
                    <input type="hidden" name="mode" value="create">
                    <input type="hidden" name="confirm" value="${location.href.split("?")[0]}">
                    <button id="create_account_button" type="button" onclick="create_account(form_data(this,true))">Create Account</button>
                </form>   
            `    
            tag("1234").focus()
        }else{
            toggle(panel)
        }
}
}    

async function confirm_account(params){
    // called by the link emailed to the user
    
    response = await post_data({
        mode:"verify_account",
        email:params.email,
        code:params.code
    })
    if(response.status==="success"){
        message({
            title:"Account Verified",
            message:"You are now logged in.",
            seconds:3
        })          
        build_menu(authenticated_menu)
        navigate({fn:show_home})
    }else{
        message({
            title:"Confirmation Failure",
            message:`Failed to confirm account: ${response.message}`,
            kind:"error",
            seconds:5    
        }) 
    }
}


async function change_password(params){
    const panel=tag("password_panel")

    if(!params){// no parameters sent, just build the form
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Old Password" name="old_password" type="password"><br>
                    <input placeholder="New Password" name="new_password" type="password"><br>
                    <input type="hidden" name="mode" value="change_password">
                    <button id="pw_button" type="button" onclick="change_password(form_data(this,true))">Change Password</button>
                </form>        
            `
        }else{
            toggle(panel)
        }

    }else if(params){ // parameters sent, must be trying to change

        // validate data before sending to server
        if(!params.old_password || !params.new_password){
            message({
                title:"Login Failed",
                message:"You must provide both the old password and the new password.",
                kind:"error",
                seconds:5    
            })
            tag("pw_button").innerHTML="Change Password"
            return
        }

        response = await post_data(params)
        tag("pw_button").innerHTML="Change Password"
        if(response.status==="success"){
            message({
                title:"Success",
                message:"Password Reset",
                seconds:3
            })            
        }else{
            message({
                title:"Failure",
                message:`Password not reset. ${response.message}`,
                kind:"error",
                seconds:5    
            })            
        }
    }    
}
  

async function update_user(params,panel){
    if(!panel){panel=tag("update_user")}
    if(typeof params === "string"){
        // passing in just an email address to be updated
        const params={
            email:params,
            button:"Update User",
            mode:"update_user"        
        }
    }
    
    if(!params){
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email Address of User" name="email"><br>
                    <input type="hidden" name="mode" value="update_user">
                    <button id="update_user_button" type="button" onclick="update_user(form_data(this,true))">Update User</button>
                </form>        
            `
        }else{
            toggle(panel)
        }
    }else{

        // validate data before sending to server
        if(!is_valid_email(params.email)){
            message({
                title:"Email Error",
                message:"You must provide the email of a user.",
                kind:"error",
                seconds:5    
            })
            tag("update_user_button").innerHTML="Update User"
            return
        }


        response = await post_data(params)
        if(tag("update_user_button")){
            tag("update_user_button").innerHTML="Update User"
        }

        if(response.status==="success"){
            message({
                title:"Success",
                message:"User updated,",
                seconds:3
            })            
        }else{
            message({
                title:"User not updated",
                message:response.message,
                kind:"error",
                seconds:5    
            })
        }

    }    
}

async function recover_password(params){
    const panel=tag("recover")
    if(!params){
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email Address" name="email"><br>
                    <input type="hidden" name="mode" value="initiate_password_reset">
                    <input type="hidden" name="reset_link" value="${location.href.split("?")[0]}">
                    <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Request Reset</button>
                    </form>        
            `
        }else{
            toggle(panel)
        }
    }else if(params.code && !params.mode){
        // user followed an email link to get here, show the from
        build_menu(unauthenticated_menu)
        show_menu()
        const panel=tag("recover")
        panel.style.display="block"
        panel.innerHTML=`
        <form>
        <input placeholder="New Password" name="password"><br>
        <input type="hidden" name="email" value="${params.email}">
        <input type="hidden" name="code" value="${params.code}">
        <input type="hidden" name="mode" value="reset_password">
        <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Reset Password</button>
        </form>        
    `
    }else if(params.code ){
        //user is submitting  a code and a new password
        
        response = await post_data(params)        
        if(panel){
            panel.innerHTML=''
            panel.style.display="none" 
        }

        if(response.status==="success"){
            message({
                title:"Success",
                message:"Rassword reset. You are now logged in",
                seconds:3
            })
            build_menu(authenticated_menu)
            show_home()
        }else{
            message({
                title:"Password not reset",
                message:response.message,
                kind:"error",
                seconds:5    
            })            
        }            

    }else if(params.mode==="initiate_password_reset"){
        // user is  initiating a request
        response = await post_data(params)
        
        if(response.status==="success"){
            message({
                title:"Email Sent",
                message:"An email was sent with an authorization code.",
                seconds:5
            })
            panel.innerHTML=`
            <form>
            <input placeholder="Code from Email" name="code"><br>
            <input placeholder="New Password" name="password"><br>
            <input type="hidden" name="email" value="${params.email}">
            <input type="hidden" name="mode" value="reset_password">
            <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Reset Password</button>
            </form>        
        `
        }else{
            tag("recover_password_button").innerHTML="Request Reset"
            message({
                title:"Server Failure",
                message:`Email not recognized`,
                kind:"error",
                seconds:5    
            })
            
        }
    }    
}



function message(params){
    //returns a reference to the message created
    // Example params{
    //     message:"Password must contain at least one Capital letter",
    //     title:"User Error",
    //     kind:"error",
    //     seconds:4
    // }

    if(!params.title){params.title="Message"}
    if(!params.seconds){params.seconds=0}

    
    let message_class="msg-head"
    if(params.kind==="error"){
        message_class += " error"
        if(params.title==="Message"){
            params.title="Error"
        }
    }
    const msg=document.createElement("div")
    msg.className="message"
    msg.innerHTML=`
    <div class="${message_class}">
      ${params.title}
      <div class="msg-ctrl">
      <i class="fas fa-times" onclick="this.parentElement.parentElement.parentElement.remove()" style="cursor: pointer;"></i>
      </div>
    </div>
    <div class="msg-body">
    ${params.message}
    </div>`
    if(params.seconds>0){
      setTimeout(function(){msg.remove()},params.seconds*1000)
    }
    tag("message-center").appendChild(msg)
    return msg

}

