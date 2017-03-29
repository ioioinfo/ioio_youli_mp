// 框架
class Warp extends React.Component {
    constructor(props) {
        super(props);
        this.state = { items: [] };
    }
    componentDidMount() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function (data) {
                this.setState({ items: data.rows });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    }
    render() {
        return React.createElement(
            "div",
            { className: "wrap" },
            React.createElement(Header, { length: this.state.items.length }),
            React.createElement(Middle, { items: this.state.items })
        );
    }
};
// 头部
class Header extends React.Component {
    render() {
        return React.createElement(
            "div",
            { className: "header" },
            React.createElement(
                "span",
                { className: "jiantou" },
                React.createElement("img", { src: "images/youli/jiantou.png", alt: "" })
            ),
            React.createElement(
                "span",
                { className: "title" },
                "\u6D88\u606F(",
                React.createElement(
                    "span",
                    null,
                    this.props.length
                ),
                ")"
            ),
            React.createElement(
                "span",
                { className: "menu" },
                React.createElement("img", { src: "images/youli/shouye1.png", alt: "" })
            )
        );
    }
};
// 中间部分
class Middle extends React.Component {
    render() {
        return React.createElement(
            "div",
            { className: "middle" },
            this.props.items.map(item => React.createElement(News, { item: item }))
        );
    }
};
// 中间消息
class News extends React.Component {
    render() {
        return React.createElement(
            "div",
            { className: "news" },
            React.createElement(
                "p",
                { className: "newsTime" },
                React.createElement(
                    "span",
                    null,
                    this.props.item.message_time_text
                )
            ),
            React.createElement(
                "div",
                { className: "newsInfor" },
                React.createElement(
                    "p",
                    { className: "newsTitle" },
                    this.props.item.message_type_name
                ),
                React.createElement(
                    "div",
                    { className: "newscontent" },
                    React.createElement(
                        "p",
                        { className: "newsimg" },
                        React.createElement("img", { src: this.props.item.img, alt: "" })
                    ),
                    React.createElement(
                        "p",
                        { className: "newsword" },
                        this.props.item.body
                    )
                )
            )
        );
    }
};
ReactDOM.render(React.createElement(Warp, { url: "get_my_messages" }), document.getElementById("app"));

