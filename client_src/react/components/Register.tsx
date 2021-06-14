/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as React from 'react';
import { Socket } from 'socket.io-client';

declare const socket: Socket;

class Register extends React.Component<{ register: boolean }, { user: string, pass: string, on: boolean }> {
    constructor (props) {
        super(props);

        this.state = {
            user: ``,
            pass: ``,
            on: false
        };
    }

    turnOn = () => {
        this.setState({ on: true });
    }

    turnOff = () => {
        this.setState({ on: false });
    }

    changeUsername = (event) => {
        this.setState({
            user: event.target.value,
            pass: this.state.pass
        });
    }

    changePassword = (event) => {
        this.setState({
            user: this.state.user,
            pass: event.target.value
        });
    }

    register = () => {
        const user = this.state.user;
        const pass = this.state.pass;

        socket?.emit(`register`, {
            user,
            pass
        });
    }

    render = () => (
        this.props.register
            ? (
                <div className="register-menu">
                    <div className="text-center m-auto">
                        <h3>New Players</h3>

                        <br />

                        <input className="overlay-input" type="text" onChange={this.changeUsername} placeholder="Username" maxLength={16} style={{ margin: 8 }} />
                        <input className="overlay-input" type="password" onChange={this.changePassword} placeholder="Password" maxLength={32} style={{ margin: 8 }} />

                        <br />
                        <button className="register" onClick={this.register}>Register!</button>

                        <br />
                        <br />

                        <p>By registering, you agree to follow our terms of service and abide by our privacy policy.</p>

                        <a href="/legal/privacy_policy.pdf" >Privacy Policy | </a>
                        <a href="/legal/tos.pdf">Terms of Service</a>
                        <br />

                        <br />
                        <p>Remember, never give your password to anyone!</p>
                    </div>
                </div>
            )
            : null
    );
}

export default Register;