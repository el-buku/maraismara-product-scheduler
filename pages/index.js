import { Heading, Page } from "@shopify/polaris";

const Index = ({db}) => (
  <Page>
    <Heading>Shopify app with Node</Heading>
    <a onClick={()=>{
      db.put({_id:'slob',sloboz:true})
      db.info().then(info=>console.log(info))}}>SBLZ</a>
  </Page>
);

export default Index;
