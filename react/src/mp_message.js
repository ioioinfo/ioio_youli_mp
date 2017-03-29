// 框架
class Warp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {items: []};
    }
    componentDidMount() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({items: data.rows});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    }
    render() {
        return (
            <div className="wrap">
                <Header length={this.state.items.length} />
                <Middle items={this.state.items} />
            </div>
        );
    }
};
// 头部
class Header extends React.Component {
    render() {
        return (
            <div className="header">
            <span className="jiantou"><img src="images/youli/jiantou.png" alt="" /></span>
            <span className="title">消息(<span>{this.props.length}</span>)</span>
            <span className="menu"><img src="images/youli/shouye1.png" alt="" /></span>
            </div>
        );
    }
};
// 中间部分
class Middle extends React.Component {
    render() {
        return (
            <div className="middle">
            {this.props.items.map(item => (
                <News item={item} />
            ))
        }
        </div>
    );
}
};
// 中间消息
class News extends React.Component {
render() {
    return (
        <div className="news">
        <p className="newsTime"><span>{this.props.item.message_time_text}</span></p>
        <div className="newsInfor">
        <p className="newsTitle">{this.props.item.message_type_name}</p>
        <div className="newscontent">
        <p className="newsimg"><img src={this.props.item.img} alt="" /></p>
        <p className="newsword">{this.props.item.body}</p>
        </div>
        </div>
        </div>
    );
}
};
ReactDOM.render(
<Warp url="get_my_messages" />,
document.getElementById("app")
);