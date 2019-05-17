<?php
/**
 * Created by PhpStorm.
 * User: tony
 * Date: 2019-05-10
 * Time: 19:57
 */

class WebSocketServer
{

    private $server;

    private $configPath;

    private $config;

    private $table;


    public function __construct()
    {
        $this->configPath = __DIR__ . '/';
        $this->getConfig();
        $this->createTable();
    }

    /**
     * run
     */
    public function run()
    {
        $this->server = new Swoole\WebSocket\Server($this->config['host'], $this->config['port']);

        $this->server->on('open', [$this, 'open']);

        $this->server->on('message', [$this, 'message']);

        $this->server->on('close', [$this, 'close']);

        $this->server->start();
    }

    public function open(Swoole\WebSocket\Server $server, $request)
    {
        $user = [
            'fd'     => $request->fd,
            'name'   => $this->config['name'][array_rand($this->config['name'])] . $request->fd,
            'avatar' => $this->config['avatar'][array_rand($this->config['avatar'])],
            'say'    => $this->config['say'][array_rand($this->config['say'])],
            'date'   => date('H:i A', time())
        ];

        $this->table->set($request->fd, $user);

        //当前用户消息
        $server->push($request->fd, json_encode(array_merge(['user' => $user, 'all' => $this->getUsers($request->fd)], ['type' => 'openSuccess'])));

        //其他用户，更新左侧用户列表
        foreach ($this->table as $value)
        {
            if ($value['fd'] == $request->fd) {
                continue;
            }
            //推送用户列表信息
            $server->push($value['fd'], json_encode(['user' => $user, 'type' => 'onLine']));
        }
    }

    /**
     * 获取所有用户
     * @return array
     */
    public function getUsers($fd)
    {
        $users = [];
        foreach ($this->table as $val) {
            if ($fd !== $val['fd']) {
                $users[] = $val;
            }
        }
        return $users;
    }

    /**
     * 发送消息
     * @param \Swoole\WebSocket\Server $server
     * @param $frame
     */
    public function message(Swoole\WebSocket\Server $server, $frame)
    {
        $message = json_decode($frame->data);
        $to = isset($message->to) ? $message->to : '';
        $this->pushMessage($server, $message->content, 'message', $frame->fd, $to);
    }

    /**
     * 推送消息
     * @param \Swoole\WebSocket\Server $server
     * @param $msg
     * @param $type
     * @param $fd
     * @param $to
     */
    private function pushMessage(Swoole\WebSocket\Server $server, $msg, $type, $fd, $to = '')
    {
        $message = htmlspecialchars($msg);
        $dataTime = date('Y-m-d H:i:s', time());
        $user = $this->table->get($fd);
        if (!empty($to)) { //发送给个人
            $server->push($to, json_encode([
                'type' => $type,
                'message' => $message,
                'time' => $dataTime,
                'user' => $user
            ]));
        } else {  //全员发送
            foreach ($this->table as $val)
            {
                if ($val['fd'] == $fd) {
                    continue;
                }

                $server->push($val['fd'], json_encode([
                    'type' => $type,
                    'message' => $message,
                    'time' => $dataTime,
                    'user' => $user
                ]));
            }
        }

    }
    /**
     * 断开连接
     * @param \Swoole\WebSocket\Server $server
     * @param $fd
     */
    public function close(Swoole\WebSocket\Server $server, $fd)
    {
        $user = $this->table->get($fd);
        $this->pushMessage($server, "{$user['name']}离开了...", 'close', $fd);
        $this->table->del($fd);
    }

    /**
     * 创建内存表
     */
    public function createTable()
    {
        $this->table = new Swoole\Table(1024);
        $this->table->column('fd', Swoole\Table::TYPE_INT);
        $this->table->column('name', Swoole\Table::TYPE_STRING, 64);
        $this->table->column('avatar', Swoole\Table::TYPE_STRING, 100);
        $this->table->column('say', Swoole\Table::TYPE_STRING, 100);
        $this->table->column('date', Swoole\Table::TYPE_STRING, 100);
        $this->table->create();
    }



    /**
     * 获取配置
     */
    private function getConfig()
    {
        $this->config = require $this->configPath . 'Config.php';
    }
}


$server = new WebSocketServer();
$server->run();
