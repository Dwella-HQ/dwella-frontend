import type { GetServerSideProps } from "next";

const IndexPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/auth/login",
    permanent: false,
  },
});

export default IndexPage;
