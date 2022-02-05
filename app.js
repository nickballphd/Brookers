
//gas project /apps/plant simple/system VISIBLE
gas_deployment_id='AKfycbxXIh853bSx3uJHGYSiGITopaNLrRVywU187rND69yYtyK4QMSXnm6pS7sqpACr45gywA'
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'

//plant simple provo
const nav_menu=[
    {label:"Home",function:"navigate({fn:'show_home'})"},
    {label:"Schedule",function:"navigate({fn:'show_schedule'})", home:"Schedule"},
    {label:"Recipes",function:"navigate({fn:'show_recipes'})", home:"Recipes"},
    {label:"List Topics",function:"navigate({fn:'show_topics'})", home:"Topics",roles:["user"]},
    {label:"Add Topics",function:"navigate({fn:'add_topics'})", roles:["member"]},
]


const unauthenticated_menu=[
    {menu:nav_menu},
    {},
    {label:"Login",function:"login()",panel:"login_panel"},
    {label:"Recover Password",function:"recover_password()",panel:"recover"},
    {label:"Create Account",function:"navigate({fn:'create_account'})", home:"Join"},
]
//{label:get_user_name()},
const authenticated_menu=[
    {menu:nav_menu},
    {},
    {label:get_user_name,id:"user-menu", menu:[
        {label:"Change Password",function:"change_password()",panel: "password_panel"},
        {label:"Personal Data",function:"navigate({fn:'personal_data'})"},
    ]},
    {label:"Logout",function:"logout()", home:"Logout"},
    {label:"Member List",function:"navigate({fn:'email_list'})",roles:["member"]},
    {label:"Admin Tools",id:"menu2", roles:["administrator"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"}
    ]},

]






function show_home(){
    
    //build the menu for the home screen
    const menu=[]
    for(item of current_menu){
        if(item.home){
            menu.push(`<a onClick="${item.function}">${item.home}</a>`)
        }
    }

    tag("canvas").innerHTML=` 
    <div class="center-screen">
    <div id="welcome">
    <h1>Plant Simple Provo</h1>
    <p>
    Plant Simple Provo is an in-person support group for people interested in learning more about living a whole-food, plant-based lifestyle.
    </p><p>
    We meet most every month and discuss books and videos, share recipies, have demonstrations for how to prepare healthy dishes, and support each other in living the good life fuled by simple, plant-based foods.
    </p>
    <div style="text-align:center"><p>${menu.join(" | ")}</p></div>
    
    
    </div></div>
    `


    hide_menu()
}

function get_user_name(){
    data=get_user_data()
    return data.first_name + " " + data.last_name
}

async function show_schedule(){
    let airtable_object_id="shrxZ1H56Kh3Jds3e"
    let width = 670

    if(intersect(get_user_data().roles, "user").length>0){
        const response=await post_data({
            mode:"get_airtable_object_id",
            name:"schedule"
        })
        if(response.status==='success'){
            airtable_object_id=response.data
            width=850
        }else{
            console.log(response)
        }
    }
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}

async function show_topics(){
    let width = 670
    const response=await post_data({
        mode:"get_airtable_object_id",
        name:"list_topics"
    })
    if(response.status==='success'){
        var airtable_object_id=response.data
    }else{
        console.log(response)
    }

    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}


async function add_topics(){
    let width = 400
    const response=await post_data({
        mode:"get_airtable_object_id",
        name:"add_topics"
    })
    if(response.status==='success'){
        var airtable_object_id=response.data
    }else{
        message({
            message:"Topic not added: " + response.message,
            title:"Server Error",
            kind:"error",
            seconds:5    
        })
    }

    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="${window.innerHeight*.9}" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}


function show_recipes(){
    window.open("/index.html", '_blank');
}

async function email_list(){
    hide_menu()
    tag("canvas").innerHTML=` 
    <div class="center-screen">
        <div class="white-box">
            <h2>Member List</h2>
            <div id="member-list-message" style="max-width:400px;padding-top:1rem;margin-bottom:1rem">
            Member information is private and should not be shared with individuals
            who are not members of the group.
            </div>
            <div id="member_list_panel">
            <i class="fas fa-spinner fa-pulse"></i>
            </div>
        </div>
    </div>
    `
    const response=await post_data({
        mode:"member_email_list",
        filter:""
    })

    const labels={
        first_name:"First Name",
        last_name:"Last Name",
        email:"Email",
        phone:"Phone",
    }


    const is_admin=intersect(get_user_data().roles, "administrator").length>0

    if(response.status==="success"){
        const html=['<table style="background-color:white"><tr>']
        for(const field of response.fields){
            html.push("<th>")
            html.push(labels[field])
            html.push("</th>")
        }
        if(is_admin){html.push("<th>Action</th>")}
        html.push("</tr>")

        for(const record of response.records){
            html.push("<tr>")
            console.log(record)
            for(const field of response.fields){
                if(record.fields[field]==="withheld"){
                  html.push('<td style="color:lightgray">')
                }else{
                  html.push("<td>")
                }
                html.push(record.fields[field])
                html.push("</td>")
            }
            if(is_admin){
                html.push("<td>")
                if(intersect(record.fields.roles, "member").length===0){
                    html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user', make_member:true},tag('member-list-message'))">Make Member</a>`)
                }else{
                    html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user'},tag('member-list-message'))">Update</a>`)
                }
                html.push("</td>")
            }
            html.push("</tr>")
        }
        html.push("</table>")
    
        tag("member_list_panel").innerHTML=html.join("")
    
    }else{
        tag("member_list_panel").innerHTML="Unable to get member list: " + response.message + "."
    }    

}



async function expense_list(){
    const response=await post_data({
        mode:"expense_list",
        filter:""
    })

    const columns=["expense_description","expense_date", "cost"]
    const html=["<table><tr>"]
    for(const field of response.fields){
        html.push("<th>")
        html.push(field)
        html.push("</th>")
    }

    for(const record of response.records){
        html.push("<tr>")
        console.log(record)
        for(const field of columns){
            html.push("<td>")
            html.push(record.fields[field])
            html.push("</td>")
        }
        html.push(`<td><a target="_blank" href="${record.fields.receipt_image[0].url}">`)
        html.push(`<img src="${record.fields.receipt_image[0].thumbnails.small.url}">`)
//        html.push(record.fields[field])
        html.push("</td>")

        html.push("</tr>")
    }
    html.push("</table>")

    tag("canvas").innerHTML=html.join("")
    hide_menu()
}


