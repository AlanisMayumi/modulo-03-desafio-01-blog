import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { AiOutlineUser } from 'react-icons/ai';
import PrismicDOM from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  const text = post.data.content.reduce((textAmount, paragraph) => {
    const { heading } = paragraph;
    const body = PrismicDOM.RichText.asText(paragraph.body);

    return textAmount + heading + body;
  }, '');
  const readingTime = text.split(/\s+/).length / 200;

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <Header />
      </Head>
      <img src={post.data.banner.url} alt="banner" />
      <main className={commonStyles.main}>
        <article className={styles.article}>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div id="info" className={commonStyles.info}>
            <time>
              <FiCalendar className={commonStyles.icon} />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <div className={commonStyles.userInfo}>
              <AiOutlineUser className={commonStyles.icon} />
              {post.data.author}
            </div>
            <div className={commonStyles.userInfo}>
              <FiClock className={commonStyles.icon} />
              <span>{readingTime.toFixed()} min</span>
            </div>
          </div>

          <div className={styles.content} />
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2 className={styles.paragraphTitle}>{content.heading}</h2>
              {content.body.map(paragraph => (
                <p key={paragraph.text} className={styles.paragraph}>
                  {paragraph.text}
                </p>
              ))}
              <br />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 10,
    }
  );

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    slug,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
