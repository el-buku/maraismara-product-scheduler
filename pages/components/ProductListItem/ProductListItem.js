import React, {useEffect} from 'react';
import {
  ResourceList,
  Avatar,
  Button,
  VisuallyHidden,
  ExceptionList,
  Truncate,
  Icon
} from '@shopify/polaris';
import createApp from '@shopify/app-bridge';
import {Redirect} from '@shopify/app-bridge/actions';
import {AlertMinor, ClockMinor} from '@shopify/polaris-icons'

import './ProductListItem.css';

export default function ProductListItem(props) {
  const {
    buildTime,
    avatarSource,
    initials,
    images,
    title,
    variants,
    note,
    openOrderCount,
    openOrdersUrl,
    latestOrderUrl,
    tags,
    handle,
    shopOrigin,
    ...rest
  } = props;


  const media = (
    <div className="CustomerListItem__Media">
      <Avatar source={avatarSource} size="medium" initials={initials} name={title}/>
    </div>
  );

  const profile = (
    <div className="CustomerListItem__Profile">
      <h3 className="CustomerListItem__Title" onClick={()=>{
        const app = createApp({
          apiKey: '3ff186762406fd3ec1e499a0136bed5a',
          shopOrigin: shopOrigin,
        });

        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, {url:`http://${shopOrigin}/products/${handle}`,newContext:true});
      }}>{title}</h3>
    </div>
  );

  const getOrders = () =>{
    if (variants) {
      return (
        <div className="CustomerListItem__Orders">
        <span className="CustomerListItem__OrderCount">
          <VisuallyHidden>&nbsp;</VisuallyHidden>
          {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
        </span>
          <span className="CustomerListItem__TotalSpent">
          <VisuallyHidden>&nbsp;</VisuallyHidden>
          <Truncate>${variants[0].price}</Truncate>
        </span>
        </div>
      )
    } else return null;
  }
const orders = getOrders();

let exceptions = [];
let conditionalActions = null;

if (buildTime != 'buildTime: 0h0m') {
  const buildTimeMarkup = (
    <span>
        <VisuallyHidden>Build Time:</VisuallyHidden>
        {buildTime.split(':')[1]}
      </span>
  );
  exceptions.push({
    icon: () => <Icon source={ClockMinor}/>,
    truncate: true,
    title: buildTimeMarkup,
  });
} else {
  const buildTimeMarkup = (
    <span>
        <VisuallyHidden>Build Time:</VisuallyHidden>
        Build time not set
      </span>
  );
  exceptions.push({
    status: 'critical',
    icon: () => <Icon source={AlertMinor}/>,
    truncate: true,
    title: buildTimeMarkup,
  });
}

// if (openOrderCount) {
//   const label = openOrderCount === 1 ? 'order' : 'orders';
//   const title = `${openOrderCount} open ${label}`;
//
//   exceptions.push({
//     status: 'warning',
//     icon: 'alert',
//     truncate: true,
//     title,
//   });
//
//   conditionalActions = (
//     <div className="CustomerListItem__ConditionalActions">
//       <Button plain url={openOrdersUrl}>
//         View open orders
//       </Button>
//     </div>
//   );
// }

const exceptionList = exceptions.length
  ? (
    <div className="CustomerListItem__Exceptions">
      <ExceptionList items={exceptions}/>
    </div>
  )
  : null;

const shortcutActions = latestOrderUrl
  ? [{content: 'View latest order', url: latestOrderUrl}]
  : null;

return (
  <ResourceList.Item
    {...rest}
    media={media}
    shortcutActions={shortcutActions}
  >
    <div className="CustomerListItem__Main">
      {profile}
      {orders}
    </div>
    {exceptionList}
    {conditionalActions}
  </ResourceList.Item>
);
}
