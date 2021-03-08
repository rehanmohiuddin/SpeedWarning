import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Button, Image, Platform, Text, View} from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import PushNotification from 'react-native-push-notification';
import firebase from '@react-native-firebase/app';
import Sound from 'react-native-sound';
import soundWarning from './warningSound.mp3';
import warning from './warning.png';
MapboxGL.setAccessToken(
  'pk.eyJ1IjoicmVoYW5tb2hpdWRkaW4iLCJhIjoiY2trdmNjZmQ4MXo0cjJ2czFkczUyZGJ2OCJ9.9xqSVO79n-16_Qd9yBxKGw',
);

export default class Home extends Component {
  constructor(props) {
    super(props);
  }
  state = {
    speed: 0,
    watchSpeed: 0,
    location: null,
    speedLimit: 0,
    showWarning: null,
  };

  componentDidMount() {
    //PushNotification.requestPermissions();

    PushNotification.getChannels(function (channel_ids) {
      console.log(channel_ids); // ['channel_id_1']
    });
    this.playSound = new Sound(soundWarning, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });
    const options = {
      distanceFilter: 1,
    };
    Geolocation.getCurrentPosition((info) => {
      //console.log('HJ', info);
      this.setState({
        location: [info.coords.longitude, info.coords.latitude],
      });
    });
    Geolocation.watchPosition(
      (position) => {
        //console.log('POS', position);
        this.fetchRoute();
      },
      (err) => {
        console.log('ERR', err);
      },
      options,
    );
  }

  fetchRoute = () => {
    axios
      .get(
        `https://route.cit.api.here.com/routing/7.2/calculateroute.json?jsonAttributes=1&waypoint0=${
          this.state.location[1]
        },${this.state.location[0]}&waypoint1=${this.state.location[1] + 0.1},${
          this.state.location[0] + 0.1
        }&routeattributes=sh,lg&legattributes=li&linkattributes=nl,fc&mode=fastest;car;traffic:enabled&app_code=vN1Q9n6R5WH63XcvFNXWwQ&app_id=zOsCcnItj1o6qfR9QZ6r
    `,
      )
      .then(
        (resp) => {
          let speedLimit = 0;
          let divide = 0;
          //console.log('resp -->', resp.data.response.route[0].leg[0].link);
          resp.data.response.route[0]?.leg[0].link.forEach((route) => {
            //console.log('LI', route?.speedLimit);
            if (route?.speedLimit) {
              speedLimit = speedLimit + route.speedLimit;
              divide = divide + 1;
            }
          });
          console.log('SPEED LIMIT -->', speedLimit);
          this.setState({speedLimit: speedLimit / divide});
        },
        (err) => {
          console.log('ERROR -->', err);
        },
      );
  };

  showWarningMessage = () => {
    return (
      <View
        style={{
          width: '80%',
          height: 200,
          position: 'absolute',
          bottom: 100,
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: 25,
          marginLeft: 35,
          borderRadius: 20,
        }}>
        <Image
          style={{width: 110, height: 80, backgroundColor: '#fff'}}
          source={warning}
        />
        <Text style={{marginTop: 15, fontWeight: 'bold'}}>SLOW DOWN</Text>
        <View style={{marginTop: 14, width: 120}}></View>
      </View>
    );
  };

  render() {
    console.log('Speed', this.state.speed);
    let show = null;
    if (this.state.speed > this.state.speedLimit && !this.state.showWarning) {
      setTimeout(() => {
        this.setState({showWarning: false});
        this.playSound?.stop();
      }, 5000);
      this.setState({showWarning: true});
      this.playSound?.play();
    }

    return (
      <View style={{flex: 1}}>
        <MapboxGL.MapView logoEnabled={false} compassEnabled style={{flex: 1}}>
          <MapboxGL.UserLocation
            visible
            onUpdate={(callBack) => {
              //console.log(callBack);
              this.setState({
                speed:
                  callBack.coords.speed < 0 ? 0 : callBack.coords.speed * 3.6,
              });
            }}
          />
          <MapboxGL.Camera
            onPress={() => this.getCurrentUserLocation()}
            ref={(ref) => (this.cameraRef = ref)}
            followZoomLevel={15}
            followUserMode="normal"
            zoomLevel={15}
            //followUserLocation
            centerCoordinate={this.state.location}
          />

          <MapboxGL.PointAnnotation
            coordinate={
              this.state.location === null ? [0, 0] : this.state.location
            }
            key={'9090'}
            id={'9090'}></MapboxGL.PointAnnotation>
        </MapboxGL.MapView>
        <View
          style={{
            position: 'absolute',
            backgroundColor: '#333',
            height: 80,
            alignItems: 'center',
            borderRadius: 10,
            left: 25,
            width: 150,
            top: 15,
            padding: 10,
          }}>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Text style={{color: '#fff'}}>YOUR SPEED : </Text>
            <Text style={{color: '#fff'}}>{this.state.speed.toFixed(2)}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Text style={{color: '#fff'}}>SPEED LIMIT : </Text>
            <Text style={{color: '#fff'}}>
              {this.state.speedLimit.toFixed(2)}
            </Text>
          </View>
        </View>
        {this.state.showWarning && this.showWarningMessage()}
      </View>
    );
  }
}
