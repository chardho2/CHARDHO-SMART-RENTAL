import React from 'react';

export class Marker extends React.Component<any> { }
export class Polyline extends React.Component<any> { }
export class Callout extends React.Component<any> { }
export const PROVIDER_GOOGLE: any = 'google';

export default class MapView extends React.Component<any> {
    animateToRegion(region: any, duration?: number) { }
    fitToCoordinates(coordinates: any[], options?: any) { }
}
