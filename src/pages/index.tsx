import { GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar } from 'react-icons/fi';
import { AiOutlineUser } from 'react-icons/ai';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page }: PostPagination = postsPagination;
  const [nextPage, setNextPage] = useState<string>(next_page);
  const [posts, setPosts] = useState<Post[]>(results);

  const carregarMaisPosts = async (): Promise<void> => {
    const response = await fetch(next_page)
      .then(res => {
        return res.json();
      })
      .then(data => {
        return data;
      });
    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  };

  return (
    <>
      <Head>
        <Header />
      </Head>

      <main className={commonStyles.main}>
        {posts.map(post => {
          return (
            <div className={styles.post} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong className={styles.title}>{post.data.title}</strong>
                  <p className={styles.subtitle}>{post.data.subtitle}</p>
                  <div id="info" className={commonStyles.info}>
                    <div>
                      <FiCalendar className={commonStyles.icon} />
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </div>
                    <div className={commonStyles.userInfo}>
                      <AiOutlineUser className={commonStyles.icon} />
                      {post.data.author}
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          );
        })}

        {nextPage && (
          <button
            type="button"
            onClick={carregarMaisPosts}
            className={styles.buttonMais}
          >
            <strong className={styles.mais}>Carregar mais posts</strong>
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const { next_page } = response;
  const results = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  const postsPagination: PostPagination = {
    results,
    next_page,
  };
  return {
    props: {
      postsPagination,
    },
  };
};
