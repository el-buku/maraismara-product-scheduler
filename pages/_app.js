import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import App, { Container } from "next/app";
import { AppProvider, Frame, Navigation } from "@shopify/polaris";
import { Provider } from "@shopify/app-bridge-react";
import Cookies from "js-cookie";
import "@shopify/polaris/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import {withRouter} from 'next/router'
import PouchDB from 'pouchdb'

const db= new PouchDB('http://maraismara.xyz/db')

const client = new ApolloClient({
  fetchOptions: {
    credentials: "include",
  },
});
class MyApp extends App {
  render() {
    const router=this.props.router
    const { Component, pageProps } = this.props;
    const shopOrigin = Cookies.get("shopOrigin");
    const navigationMarkup = (
      <Navigation location={router.pathname}>
        <Navigation.Section
          separator
          title="Product Scheduler"
          items={[
            {
              label: "Dashboard",
              onClick: () => {router.push('/')}
            },
            {
              label: "Orders",
              onClick: () => {router.push('/orders')}
            },
            {
              label: "Products",
              onClick: () =>{router.push('/products')}
            },
            {
              label: "Calendar",
              onClick:() => router.push('/calendar')
            }
          ]}
        />
      </Navigation>
    );

    return (
      <Container>
        <AppProvider i18n={translations}>
          <Provider
            config={{
              apiKey: API_KEY,
              shopOrigin: shopOrigin,
              forceRedirect: true,
            }}
          >
            <ApolloProvider client={client}>
              <Frame navigation={navigationMarkup}>
                <Component {...pageProps} db={db} shopOrigin={shopOrigin}/>
              </Frame>
            </ApolloProvider>
          </Provider>
        </AppProvider>
      </Container>
    );
  }
}


export default withRouter(MyApp);
