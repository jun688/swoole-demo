$(function () {
    chat.init();

    $("#send").click(function () {
        //如果不选用户，则发送所有人
        //选中用户，只推送给当前用户
        chat.sendMsg();
    });

    $('#send_val').bind('keypress',function(event){
        if(event.keyCode == 13) {
            chat.sendMsg();
        }
    });


    //选中当前用户
    $(".people").on('click', 'li', (function () {
        console.log('sss');
        $(this).siblings('li').removeClass('active');
        $(this).addClass("active");

    }));

});

var config = {
    host: 'ws://0.0.0.0:9501'
};

var chat = {
    data: {
        wsServer: null,
        info: {}
    },

    init: function () {
        this.data.wsServer = new WebSocket(config.host);
        this.open();
        this.message();
        this.close();
        this.error();
    },

    open: function() {
       this.data.wsServer.onopen = function(event) {
          chat.notice('连接成功', 1);
        }
    },

    close: function() {
        this.data.wsServer.oncolse = function (event) {
            chat.onLine(0);
        }
    },

    message: function() {
        this.data.wsServer.onmessage = function (event) {
            var data = jQuery.parseJSON(event.data);
            console.log(data);
            switch (data.type) {
                case 'open':
                    chat.appendUser(data.user.name, data.user.avatar, data.user.fd, data.user,say, data.user.date);
                    break;
                case 'close':
                    chat.removeUser(data.user.fd);
                    break;
                case 'openSuccess':
                    chat.onLineUser(data.user);
                    chat.onLine(1);
                    chat.showAllUser(data.all);
                    chat.chatContent(data.user);
                    break;
                case 'onLine':
                    console.log(data.user);
                    chat.addUser(data.user);
                    break;
                case 'message':
                    chat.newMessage(data);
                    break;
            }
        }
    },

    error: function() {
        this.data.wsServer.onerror = function (event, e) {
            console.log('Error:' + event.data)
        }
    },
    sendMsg: function () {
        var content = $("#send_val").val();
        var toFd = $('.people .active').attr('data');
        if ($.trim(content) == '') {
            $(".container").toast({
                content: '发送内容不能为空',
                duration: 1000
            });
            return false;
        }
        //发送消息
        var sendMsg = {'content':content, 'to':toFd};
        this.data.wsServer.send(JSON.stringify(sendMsg));
        //获取当前用户的名称，头像
        var avatar = $('.left .top img').attr('src');
        var name = $('.left .top .name').text();
        var msg = '<img src="'+avatar+'" class="me me-img">'
                 + '<span class="people_name_me">'+name+'</span>'
                 + '<span class="bubble me">'+ content +'</span>';
        $(".chat").append(msg);
        $("#send_val").val('');
    },
    onLine: function (status) {
        var color =  status ? 'green' : 'red'; 
        var msg = status ? 'On' : 'Off';
        var html= '<span style="color:'+ color +'">' + msg +'</span>';
        $(".line").append(html);
    },
    onLineUser:function(user) {
        var html = '<img src="'+user.avatar+'" alt="">' +
            '<div class="line"></div>' +
            '<div class="name">'+user.name+'</div>';

        $('.left .top').append(html);
    },
    removeUser: function (fd) {
        $(".fd-" + fd).remove();
    },
    chatContent: function(user)
    {
        console.log('sss', user);
        var chatContent = '<div class="chat active-chat fd-'+user.fd+'" data-chat="person'+user.fd+'"></div>';
        $('#content').append(chatContent);
    },
    showAllUser: function (users) {
        for ( i in users) {
            this.appendUser(users[i].name, users[i].avatar, users[i].fd, users[i].say, users[i].date)
        }
    },
    addUser:function (user) {
            this.updateUser(user.name, user.avatar, user.fd, user.say, user.date)
    },
    appendUser: function (name, avatar, fd, say, login_date) {
        var html = ' <li class="person fd-'+ fd +'" data-chat="person'+fd+'" data="'+fd+'">'
           + '<img src="'+ avatar +'" alt="' + name +  '">'
           + '<span class="name">'+ name +'</span>'
           + '<span class="time">'+ login_date+'</span>'
           + '<span class="preview">'+ say +'</span>'
           + '</li>';
        $(".people").append(html);
    },
    updateUser: function (name, avatar, fd, say, login_date) {
        var html = ' <li class="person fd-' + fd + '" data-chat="person' + fd + '">'
            + '<img src="' + avatar + '" alt="' + name + '">'
            + '<span class="name">' + name + '</span>'
            + '<span class="time">' + login_date + '</span>'
            + '<span class="preview">' + say + '</span>'
            + '</li>';
        $(".people").append(html);
    },
    newMessage: function (data) {
        var msg = '<img class="you-img" src="'+data.user.avatar+'">'
            + '<span class="people_name">'+data.user.name+'</span>'
            + '<span class="bubble you">'+ data.message +'</span>';
        $('.chat').append(msg);
    },
    notice: function (msg, color) {
        var color = color ? 'green' : 'red';
        var html = '<strong style="color: '+color+'">'+msg+'</strong>';
        $(".top .name").append(html);
    }

};
